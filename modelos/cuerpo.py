# Genera los cuerpos de la app en public/modelos/: el cuerpo base de MakeHuman (CC0) con su piel, cara,
# pelo y zapatos (mujer.glb, hombre.glb) y, aparte, cada prenda de su catálogo (mujer/<prenda>.glb),
# todo con una forma por cada extremo de los controles de la app, para mezclarlas en el navegador.
# Cada prenda lleva también una máscara (mujer/<prenda>.png) con la piel que tapa, y el catálogo de
# cada cuerpo va en mujer.json.
#
# Hace falta Blender 5.x con la extensión MPFB y los paquetes de recursos de MakeHuman (el de sistema
# y los de ropa que se citan en el README) descomprimidos en una carpeta, que se pasa en MAKEHUMAN_ASSETS.
# Uso, desde la raíz del repositorio:
#   MAKEHUMAN_ASSETS=/ruta/al/paquete blender -b --python modelos/cuerpo.py
import json
import math
import os

import bmesh
import bpy
import numpy as np
from mathutils import Matrix, Quaternion
from mathutils.bvhtree import BVHTree
from bl_ext.blender_org.mpfb.services.humanservice import HumanService
from bl_ext.blender_org.mpfb.services.targetservice import TargetService

RECURSOS = os.environ["MAKEHUMAN_ASSETS"]
SALIDA = os.path.join(os.getcwd(), "public", "modelos")

# nombre del archivo -> (valor de "gender" en MakeHuman, piel, peinado, zapatos)
CUERPOS = {
    "mujer": (0.0, "young_caucasian_female", "long01", "toigo_ballet_flats"),
    "hombre": (1.0, "young_caucasian_male", "short02", "shoes04"),
}
# El catálogo de cada cuerpo: (prenda de MakeHuman, hueco de la app, nombre en la app). La primera de
# cada hueco es la que se usa para una foto guardada antes de que hubiera catálogo.
CATALOGO = {
    "mujer": [
        ("toigo_basic_tucked_t-shirt", "arriba", "Camiseta"),
        ("punkduck_v_neck_top", "arriba", "Top de tirantes"),
        ("punkduck_off-shoulder_long-sleeve_top", "arriba", "Blusa de hombros al aire"),
        ("mindfront_knitted_sweater_01", "arriba", "Jersey"),
        ("punkduck_female_tight_jeans", "abajo", "Vaqueros pitillo"),
        ("elvs_jeans_straight_leg", "abajo", "Vaqueros rectos"),
        ("elvs_gored_elephant_pants", "abajo", "Pantalón ancho"),
        ("mindfront_female_trousers_1", "abajo", "Pantalón de vestir"),
        ("elvs_pencil_skirt", "abajo", "Falda de tubo"),
        ("punkduck_retro_polka_dot_skirt", "abajo", "Falda midi"),
        ("punkduck_black_mini_skirt", "abajo", "Minifalda"),
        ("toigo_halter_dress_midi", "vestido", "Vestido halter"),
        ("punkduck_black_cocktail_dress", "vestido", "Vestido de cóctel"),
        ("mindfront_f_dress_06", "vestido", "Vestido de pico"),
        ("elvs_simple_fashion_dress_1", "vestido", "Vestido largo"),
    ],
    "hombre": [
        ("namuhekam_male_polo_shirt", "arriba", "Polo"),
        ("elvs_male_shirt_untucked_bd1", "arriba", "Camisa"),
        ("mindfront_knitted_sweater_02", "arriba", "Jersey"),
        ("punkduck_male_classic_jeans", "abajo", "Vaqueros"),
        ("mindfront_male_trousers_2", "abajo", "Pantalón de vestir"),
    ],
}
# Las piezas de la cara: (carpeta, nombre, tipo en MPFB, textura). Sin ellas la cara es de muñeco.
CARA = [
    ("eyes", "low-poly", "Eyes", "eyes/materials/brown_eye.png"),
    ("eyebrows", "eyebrow001", "Eyebrows", "eyebrows/eyebrow001/eyebrow001.png"),
    ("eyelashes", "eyelashes01", "Eyelashes", "eyelashes/eyelashes01/eyelashes01.png"),
]
# La textura de piel viene a 2048 px; a la mitad pesa un cuarto y en un móvil no se nota
LADO_PIEL = 1024
# Los zapatos ocupan unos pocos píxeles en pantalla
LADO_ZAPATOS = 256
# La máscara de la piel tapada por cada prenda, en el espacio de la textura de la piel
LADO_MASCARA = 512
# MakeHuman crea el cuerpo con los brazos abiertos; se bajan este ángulo para una postura de pie natural
BRAZOS = math.radians(30)
# Y estira el codo (MakeHuman lo deja doblado hacia delante) y dobla un poco los dedos: la mano en reposo
CODO = math.radians(-25)
DEDOS = math.radians(20)
# La tela ceñida coincide con la piel; separada estos metros, la piel no asoma por el borde de la prenda
HOLGURA = 0.004

# Cada forma es el cuerpo base con un solo valor llevado a su extremo (0 o 1; el medio es 0.5)
FORMAS = {
    "delgado": {"weight": 0.0},
    "corpulento": {"weight": 1.0},
    "bajo": {"height": 0.0},
    "alto": {"height": 1.0},
}


# Dónde empieza la ropa en lo que devuelve crear(): antes van el cuerpo, el pelo, la cara y los zapatos
ROPA = 3 + len(CARA)


def crear(genero, peinado, zapatos, prendas, cambios):
    """Cuerpo con el pelo, la cara, los zapatos y las prendas ya ajustados a él. Devuelve [cuerpo, pelo, *cara, zapatos, *prendas], con las formas y la postura aplicadas."""
    macro = TargetService.get_default_macro_info_dict()
    macro.update({"gender": genero, **cambios})
    cuerpo = HumanService.create_human(macro_detail_dict=macro)
    # El esqueleto solo sirve para poner la postura: no se exporta
    esqueleto = HumanService.add_builtin_rig(cuerpo, "default")
    mallas = [cuerpo]
    recursos = [("hair", peinado, "Hair"), *(pieza[:3] for pieza in CARA), ("clothes", zapatos, "Clothes")]
    recursos += [("clothes", prenda, "Clothes") for prenda in prendas]
    for carpeta, nombre, tipo in recursos:
        antes = set(bpy.data.objects)
        HumanService.add_mhclo_asset(
            os.path.join(RECURSOS, carpeta, nombre, nombre + ".mhclo"), cuerpo, asset_type=tipo,
            subdiv_levels=0, set_up_rigging=True, interpolate_weights=True, import_subrig=False, import_weights=False,
        )
        (malla,) = [o for o in set(bpy.data.objects) - antes if o.type == "MESH"]
        mallas.append(malla)
    TargetService.bake_targets(cuerpo)

    for lado, signo in (("L", 1), ("R", -1)):
        hueso = esqueleto.pose.bones["upperarm01." + lado]
        # Gira el brazo hacia abajo alrededor del hombro, en el plano del frente
        hombro = Matrix.Translation(hueso.head)
        hueso.matrix = hombro @ Matrix.Rotation(signo * BRAZOS, 4, "Y") @ hombro.inverted() @ hueso.matrix
        bpy.context.view_layer.update()
        # El pulgar se dobla la mitad que los demás dedos
        giros = [("lowerarm01", CODO)] + [(f"finger{d}-{f}", DEDOS / 2 if d == 1 else DEDOS) for d in range(1, 6) for f in (1, 2, 3)]
        for nombre, angulo in giros:
            hueso = esqueleto.pose.bones[f"{nombre}.{lado}"]
            hueso.rotation_mode = "QUATERNION"
            hueso.rotation_quaternion = Quaternion((1, 0, 0), angulo)
    bpy.context.view_layer.update()
    for malla in mallas:
        lugar = malla.matrix_world.copy()
        # Al doblar el hombro la malla se arruga en la axila; el suavizado correctivo reparte ese pliegue.
        # Solo corrige si se calcula junto con el esqueleto, así que no se aplican uno a uno: se copia el
        # resultado de los dos, con los demás modificadores (las máscaras) apagados para no perder vértices.
        suavizado = malla.modifiers.new("suavizado", "CORRECTIVE_SMOOTH")
        suavizado.iterations = 10
        postura = [m for m in malla.modifiers if m.type in ("ARMATURE", "CORRECTIVE_SMOOTH")]
        resto = [(m, m.show_viewport) for m in malla.modifiers if m not in postura]
        for modificador, _ in resto:
            modificador.show_viewport = False
        colocada = malla.evaluated_get(bpy.context.evaluated_depsgraph_get()).data
        assert len(colocada.vertices) == len(malla.data.vertices), malla.name
        posiciones = [v.co.copy() for v in colocada.vertices]
        for modificador in postura:
            malla.modifiers.remove(modificador)
        for vertice, posicion in zip(malla.data.vertices, posiciones):
            vertice.co = posicion
        for modificador, visible in resto:
            modificador.show_viewport = visible
        malla.parent = None
        malla.matrix_world = lugar
    bpy.data.objects.remove(esqueleto)
    for prenda in mallas[ROPA:]:
        for vertice in prenda.data.vertices:
            vertice.co += vertice.normal * HOLGURA
    bpy.context.view_layer.update()
    return mallas


def copiar_forma(base, variante, nombre):
    """Guarda en `base` una forma con los vértices de `variante`, que tiene su misma malla."""
    assert len(variante.data.vertices) == len(base.data.vertices), (nombre, base.name)
    # Las posiciones se llevan al espacio de la base: los pies siempre quedan en el suelo
    a_base = base.matrix_world.inverted() @ variante.matrix_world
    forma = base.shape_key_add(name=nombre)
    for v in variante.data.vertices:
        forma.data[v.index].co = a_base @ v.co


def material_simple(nombre, imagen, transparente=True):
    """Material con el color y la transparencia de una textura, que es lo que entiende el formato web."""
    material = bpy.data.materials.new(nombre)
    material.use_nodes = True
    nodos = material.node_tree
    textura = nodos.nodes.new("ShaderNodeTexImage")
    textura.image = imagen
    principal = nodos.nodes["Principled BSDF"]
    nodos.links.new(textura.outputs["Color"], principal.inputs["Base Color"])
    if transparente:
        nodos.links.new(textura.outputs["Alpha"], principal.inputs["Alpha"])
    return material


def textura(carpeta, lado):
    """La imagen de color del material de MakeHuman (.mhmat) que hay en la carpeta de un recurso, reducida a `lado` px."""
    (mhmat,) = [nombre for nombre in os.listdir(carpeta) if nombre.endswith(".mhmat")]
    (archivo,) = [linea.split()[1] for linea in open(os.path.join(carpeta, mhmat), encoding="utf-8") if linea.startswith("diffuseTexture ")]
    imagen = bpy.data.images.load(os.path.join(carpeta, archivo))
    imagen.scale(lado, lado)
    return imagen


def poner_material(malla, material):
    malla.data.materials.clear()
    malla.data.materials.append(material)


def mascara(cuerpo, caras):
    """Los píxeles de la textura de la piel que caen en estas caras del cuerpo, más uno de margen."""
    uv = np.array([esquina.uv[:] for esquina in cuerpo.data.uv_layers.active.data])
    tapada = np.zeros((LADO_MASCARA, LADO_MASCARA), bool)
    centros = (np.arange(LADO_MASCARA) + 0.5) / LADO_MASCARA
    for cara in caras:
        esquinas = uv[list(cara.loop_indices)]
        for k in range(1, len(esquinas) - 1):
            a, b, c = esquinas[0], esquinas[k], esquinas[k + 1]
            x0, y0 = np.clip(np.floor(np.minimum.reduce([a, b, c]) * LADO_MASCARA).astype(int), 0, LADO_MASCARA)
            x1, y1 = np.clip(np.ceil(np.maximum.reduce([a, b, c]) * LADO_MASCARA).astype(int), 0, LADO_MASCARA)
            x, y = np.meshgrid(centros[x0:x1], centros[y0:y1])
            # De qué lado de cada arista del triángulo cae cada píxel: dentro, si de todas del mismo
            lados = [(q[0] - p[0]) * (y - p[1]) - (q[1] - p[1]) * (x - p[0]) for p, q in ((a, b), (b, c), (c, a))]
            dentro = np.logical_and.reduce([l >= 0 for l in lados]) | np.logical_and.reduce([l <= 0 for l in lados])
            tapada[y0:y1, x0:x1] |= dentro
    # Sin margen, en el filo entre una cara tapada y una a la vista podría asomar una línea de piel
    return tapada | np.roll(tapada, 1, 0) | np.roll(tapada, -1, 0) | np.roll(tapada, 1, 1) | np.roll(tapada, -1, 1)


def guardar_mascara(tapada, destino):
    imagen = bpy.data.images.new("mascara", LADO_MASCARA, LADO_MASCARA)
    pixeles = np.zeros((LADO_MASCARA, LADO_MASCARA, 4), np.float32)
    pixeles[tapada] = 1  # blanco donde la prenda tapa la piel; las filas van de abajo arriba, como la textura
    pixeles[..., 3] = 1
    imagen.pixels = pixeles.ravel()
    imagen.filepath_raw = destino
    imagen.file_format = "PNG"
    imagen.save()


def exportar(objetos, destino):
    bpy.ops.object.select_all(action="DESELECT")
    for objeto in objetos:
        objeto.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=destino,
        use_selection=True,
        export_morph=True,
        export_morph_normal=True,
        export_skins=False,
        export_animations=False,
        export_image_format="WEBP",
        export_yup=True,
    )


for archivo, (genero, piel, peinado, zapatos) in CUERPOS.items():
    catalogo = CATALOGO[archivo]
    nombres = [prenda for prenda, _, _ in catalogo]
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mallas = crear(genero, peinado, zapatos, nombres, {})
    cuerpo, pelo, *cara, calzado = mallas[:ROPA]
    prendas = mallas[ROPA:]
    cuerpo.name, pelo.name, calzado.name = "cuerpo", "pelo", "zapatos"
    poner_material(calzado, material_simple("zapatos", textura(os.path.join(RECURSOS, "clothes", zapatos), LADO_ZAPATOS), transparente=False))
    for malla, (_, nombre, _, ruta) in zip(cara, CARA):
        malla.name = nombre
        poner_material(malla, material_simple(nombre, bpy.data.images.load(os.path.join(RECURSOS, ruta))))
    for malla, nombre in zip(prendas, nombres):
        malla.name = nombre
        malla.data.materials.clear()  # la app les pone la tela de la foto
    for objeto in mallas:
        objeto.shape_key_add(name="Basis")

    for nombre, cambios in FORMAS.items():
        variantes = crear(genero, peinado, zapatos, nombres, cambios)
        for base, variante in zip(mallas, variantes):
            copiar_forma(base, variante, nombre)
        for variante in reversed(variantes):
            bpy.data.objects.remove(variante)

    # La malla trae geometría auxiliar (guías para la ropa y las articulaciones) que no es cuerpo. Los
    # pies dentro de los zapatos también sobran: los zapatos van siempre puestos.
    indice_cuerpo = cuerpo.vertex_groups["body"].index
    indice_pies = cuerpo.vertex_groups["Delete." + zapatos].index
    malla = bmesh.new()
    malla.from_mesh(cuerpo.data)
    capa = malla.verts.layers.deform.verify()
    bmesh.ops.delete(malla, geom=[v for v in malla.verts if indice_cuerpo not in v[capa] or indice_pies in v[capa]], context="VERTS")
    malla.to_mesh(cuerpo.data)
    malla.free()

    poner_material(cuerpo, material_simple("piel", textura(os.path.join(RECURSOS, "skins", piel), LADO_PIEL), transparente=False))
    imagen_pelo = next(n.image for m in pelo.data.materials for n in m.node_tree.nodes if n.type == "TEX_IMAGE" and n.image)
    poner_material(pelo, material_simple("pelo", imagen_pelo))

    # Cada prenda trae la lista de vértices del cuerpo que tapa. De esas caras, las que la tela tapa del
    # todo van a su máscara, para que la app no pinte esa piel mientras la llevas: si no, asoma por la
    # tela ceñida. Se mira si la tela está delante de toda la cara, desde un poco dentro por si la piel
    # la atraviesa. La cara que solo queda tapada a medias, en el borde de una prenda, se deja a la
    # vista: escondida abriría un agujero junto al borde.
    giro = cuerpo.matrix_world.to_3x3()
    carpeta = os.path.join(SALIDA, archivo)
    os.makedirs(carpeta, exist_ok=True)
    for prenda, nombre in zip(prendas, nombres):
        # Algunas prendas no traen esa lista: entonces se miran todas las caras
        grupo = cuerpo.vertex_groups.get("Delete." + nombre)
        tela = BVHTree.FromPolygons([prenda.matrix_world @ v.co for v in prenda.data.vertices], [tuple(c.vertices) for c in prenda.data.polygons])

        def tapa(punto, hacia_fuera):
            # La tela tiene que mirar hacia el mismo lado que la piel: así la del torso no cuenta como encima
            # del interior del brazo, que está a pocos centímetros pero mirándola de frente
            # shortcut: 8 cm de alcance; la piel bajo una prenda más holgada se deja pintada (queda dentro de la tela)
            _, normal, _, _ = tela.ray_cast(punto - hacia_fuera * 0.02, hacia_fuera, 0.1)
            return normal is not None and normal.dot(hacia_fuera) > 0.5

        tapadas = []
        for poligono in cuerpo.data.polygons:
            if grupo and not any(g.group == grupo.index for v in poligono.vertices for g in cuerpo.data.vertices[v].groups):
                continue
            hacia_fuera = (giro @ poligono.normal).normalized()
            puntos = [cuerpo.matrix_world @ p for p in (poligono.center, *(cuerpo.data.vertices[v].co for v in poligono.vertices))]
            if all(tapa(p, hacia_fuera) for p in puntos):
                tapadas.append(poligono)
        assert tapadas, nombre  # toda prenda tapa algo de piel: si no, no se ha ajustado al cuerpo
        guardar_mascara(mascara(cuerpo, tapadas), os.path.join(carpeta, nombre + ".png"))

    for objeto in mallas:
        for modificador in list(objeto.modifiers):
            objeto.modifiers.remove(modificador)
        for poligono in objeto.data.polygons:
            poligono.use_smooth = True

    exportar([cuerpo, pelo, *cara, calzado], os.path.join(SALIDA, archivo + ".glb"))
    for prenda, nombre in zip(prendas, nombres):
        exportar([prenda], os.path.join(carpeta, nombre + ".glb"))
    with open(os.path.join(SALIDA, archivo + ".json"), "w", encoding="utf-8") as lista:
        json.dump([{"id": prenda, "hueco": hueco, "nombre": nombre} for prenda, hueco, nombre in catalogo], lista, ensure_ascii=False, indent=1)
    pesos = {nombre: os.path.getsize(os.path.join(carpeta, nombre + ".glb")) // 1000 for nombre in nombres}
    print("CUERPO_OK", archivo, os.path.getsize(os.path.join(SALIDA, archivo + ".glb")) // 1000, "KB; prendas (KB):", pesos)
