# Genera public/modelos/mujer.glb y hombre.glb: el cuerpo base de MakeHuman (CC0) con pelo, un
# conjunto de dos prendas y, si lo tiene, un vestido, y una forma por cada extremo de los controles
# de la app, para mezclarlas en el navegador.
#
# Hace falta Blender 5.x con la extensión MPFB y el paquete de recursos libres de MakeHuman
# ("makehuman_system_assets_cc0.zip") descomprimido; su carpeta se pasa en MAKEHUMAN_ASSETS.
# Uso, desde la raíz del repositorio:
#   MAKEHUMAN_ASSETS=/ruta/al/paquete blender -b --python modelos/cuerpo.py
import math
import os

import bmesh
import bpy
from mathutils import Matrix, Quaternion
from mathutils.bvhtree import BVHTree
from bl_ext.blender_org.mpfb.services.humanservice import HumanService
from bl_ext.blender_org.mpfb.services.targetservice import TargetService

RECURSOS = os.environ["MAKEHUMAN_ASSETS"]
SALIDA = os.path.join(os.getcwd(), "public", "modelos")

# nombre del archivo -> (valor de "gender" en MakeHuman, piel, peinado, zapatos, conjunto, vestido o None)
# El conjunto tiene que venir en dos piezas sueltas, la de arriba y el pantalón.
# El vestido es del paquete Dress 01 y las bailarinas, del Shoes 01 (los dos CC0); se descomprimen en
# la misma carpeta de recursos.
CUERPOS = {
    "mujer": (0.0, "young_caucasian_female", "long01", "toigo_ballet_flats", "female_casualsuit01", "toigo_halter_dress_midi"),
    "hombre": (1.0, "young_caucasian_male", "short02", "shoes04", "male_casualsuit04", None),
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


def crear(genero, peinado, zapatos, conjunto, vestido, cambios):
    """Cuerpo con el pelo, la cara, los zapatos y la ropa ya ajustados a él. Devuelve [cuerpo, pelo, *cara, zapatos, ropa] y, si lo hay, el vestido, con las formas y la postura aplicadas."""
    macro = TargetService.get_default_macro_info_dict()
    macro.update({"gender": genero, **cambios})
    cuerpo = HumanService.create_human(macro_detail_dict=macro)
    # El esqueleto solo sirve para poner la postura: no se exporta
    esqueleto = HumanService.add_builtin_rig(cuerpo, "default")
    mallas = [cuerpo]
    recursos = [("hair", peinado, "Hair"), *(pieza[:3] for pieza in CARA), ("clothes", zapatos, "Clothes"), ("clothes", conjunto, "Clothes")]
    recursos += [("clothes", vestido, "Clothes")] if vestido else []
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


for archivo, (genero, piel, peinado, zapatos, conjunto, nombre_vestido) in CUERPOS.items():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mallas = crear(genero, peinado, zapatos, conjunto, nombre_vestido, {})
    cuerpo, pelo, *cara, calzado = mallas[:ROPA]
    ropa, *vestido = mallas[ROPA:]
    cuerpo.name, pelo.name, calzado.name = "cuerpo", "pelo", "zapatos"
    poner_material(calzado, material_simple("zapatos", textura(os.path.join(RECURSOS, "clothes", zapatos), LADO_ZAPATOS), transparente=False))
    for malla, (_, nombre, _, ruta) in zip(cara, CARA):
        malla.name = nombre
        poner_material(malla, material_simple(nombre, bpy.data.images.load(os.path.join(RECURSOS, ruta))))
    for malla in vestido:
        malla.name = "vestido"
        assert malla.name == "vestido"  # la app la reconoce por este nombre
        malla.data.materials.clear()
    for objeto in mallas:
        objeto.shape_key_add(name="Basis")

    for nombre, cambios in FORMAS.items():
        variantes = crear(genero, peinado, zapatos, conjunto, nombre_vestido, cambios)
        for base, variante in zip(mallas, variantes):
            copiar_forma(base, variante, nombre)
        for variante in reversed(variantes):
            bpy.data.objects.remove(variante)

    # La malla trae geometría auxiliar (guías para la ropa y las articulaciones) que no es cuerpo. Los
    # pies dentro de los zapatos también sobran: los zapatos van siempre puestos.
    indice_cuerpo = cuerpo.vertex_groups["body"].index
    mascara_zapatos = "Delete." + zapatos
    indice_pies = cuerpo.vertex_groups[mascara_zapatos].index
    malla = bmesh.new()
    malla.from_mesh(cuerpo.data)
    capa = malla.verts.layers.deform.verify()
    bmesh.ops.delete(malla, geom=[v for v in malla.verts if indice_cuerpo not in v[capa] or indice_pies in v[capa]], context="VERTS")
    malla.to_mesh(cuerpo.data)
    malla.free()

    # El conjunto se separa en sus dos piezas, ya con sus formas: la que llega más alto es la de arriba.
    # Van sin material: la app les pone el color.
    ropa.data.materials.clear()
    bpy.ops.object.select_all(action="DESELECT")
    ropa.select_set(True)
    bpy.context.view_layer.objects.active = ropa
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.separate(type="LOOSE")
    bpy.ops.object.mode_set(mode="OBJECT")
    pantalon, camiseta = sorted(bpy.context.selected_objects, key=lambda o: max(v.co.z for v in o.data.vertices))
    pantalon.name, camiseta.name = "pantalon", "camiseta"
    assert (pantalon.name, camiseta.name) == ("pantalon", "camiseta")  # la app las reconoce por este nombre
    prendas = (camiseta, pantalon, *vestido)
    mallas = [cuerpo, pelo, *cara, calzado, *prendas]

    # Cada prenda trae la lista de vértices del cuerpo que tapa. Esas caras van con un material que
    # dice qué prendas tienen encima (una, o varias en la cintura), para que salgan como piezas
    # aparte y la app esconda las de las prendas puestas: si no, el cuerpo asoma por la tela ceñida.
    # (la otra máscara del cuerpo, "body", es la que esconde la geometría auxiliar)
    tapado = {cuerpo.vertex_groups[m.vertex_group].index for m in cuerpo.modifiers if m.type == "MASK" and m.vertex_group not in ("body", mascara_zapatos)}
    assert len(tapado) == len(prendas) - 1, tapado  # una máscara por el conjunto y otra por el vestido
    telas = [
        BVHTree.FromPolygons([p.matrix_world @ v.co for v in p.data.vertices], [tuple(c.vertices) for c in p.data.polygons])
        for p in prendas
    ]
    cuerpo.data.materials.clear()
    imagen_piel = textura(os.path.join(RECURSOS, "skins", piel), LADO_PIEL)
    # El índice de cada material suma 1 por la camiseta, 2 por el pantalón y 4 por el vestido:
    # "piel", "bajo_camiseta", "bajo_pantalon", "bajo_camiseta_pantalon", "bajo_vestido"…
    for indice in range(2 ** len(prendas)):
        encima = [p.name for i, p in enumerate(prendas) if indice >> i & 1]
        nombre = "_".join(["bajo", *encima]) if encima else "piel"
        material = material_simple(nombre, imagen_piel, transparente=False)
        assert material.name == nombre  # la app las reconoce por este nombre
        cuerpo.data.materials.append(material)
    giro = cuerpo.matrix_world.to_3x3()
    for poligono in cuerpo.data.polygons:
        if any(g.group in tapado for v in poligono.vertices for g in cuerpo.data.vertices[v].groups):
            hacia_fuera = (giro @ poligono.normal).normalized()
            puntos = [cuerpo.matrix_world @ p for p in (poligono.center, *(cuerpo.data.vertices[v].co for v in poligono.vertices))]
            # Una tela tapa la cara si está delante de toda ella; se mira desde un poco dentro, por si la piel
            # la atraviesa. La cara que solo queda tapada a medias, en el borde de una prenda, se deja a la
            # vista: escondida abriría un agujero junto al borde.
            # shortcut: 8 cm de alcance, medido para estos conjuntos; una prenda más holgada no taparía nada
            encima = [all(tela.ray_cast(p - hacia_fuera * 0.02, hacia_fuera, 0.1)[0] is not None for p in puntos) for tela in telas]
            poligono.material_index = sum(tapa << i for i, tapa in enumerate(encima))
    imagen_pelo = next(n.image for m in pelo.data.materials for n in m.node_tree.nodes if n.type == "TEX_IMAGE" and n.image)
    poner_material(pelo, material_simple("pelo", imagen_pelo))
    for objeto in mallas:
        for modificador in list(objeto.modifiers):
            objeto.modifiers.remove(modificador)
        for poligono in objeto.data.polygons:
            poligono.use_smooth = True

    os.makedirs(SALIDA, exist_ok=True)
    destino = os.path.join(SALIDA, archivo + ".glb")
    bpy.ops.object.select_all(action="DESELECT")
    for objeto in mallas:
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
    print("CUERPO_OK", archivo, *(len(o.data.vertices) for o in mallas), os.path.getsize(destino), "bytes")
