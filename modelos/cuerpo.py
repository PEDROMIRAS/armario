# Genera public/modelos/mujer.glb y hombre.glb: el cuerpo base de MakeHuman (CC0) con pelo y una
# prenda, y una forma por cada extremo de los controles de la app, para mezclarlas en el navegador.
#
# Hace falta Blender 5.x con la extensión MPFB y el paquete de recursos libres de MakeHuman
# ("makehuman_system_assets_cc0.zip") descomprimido; su carpeta se pasa en MAKEHUMAN_ASSETS.
# Uso, desde la raíz del repositorio:
#   MAKEHUMAN_ASSETS=/ruta/al/paquete blender -b --python modelos/cuerpo.py
import math
import os

import bmesh
import bpy
from mathutils import Matrix
from bl_ext.blender_org.mpfb.services.humanservice import HumanService
from bl_ext.blender_org.mpfb.services.targetservice import TargetService

RECURSOS = os.environ["MAKEHUMAN_ASSETS"]
SALIDA = os.path.join(os.getcwd(), "public", "modelos")

# nombre del archivo -> (valor de "gender" en MakeHuman, peinado, prenda)
CUERPOS = {"mujer": (0.0, "long01", "female_casualsuit01"), "hombre": (1.0, "short02", "male_casualsuit01")}
# Las mallas de cada archivo, en el orden en que las devuelve crear()
NOMBRES = ("cuerpo", "pelo", "prenda")
# MakeHuman crea el cuerpo con los brazos abiertos; se bajan este ángulo para una postura de pie natural
BRAZOS = math.radians(30)

# Cada forma es el cuerpo base con un solo valor llevado a su extremo (0 o 1; el medio es 0.5)
FORMAS = {
    "delgado": {"weight": 0.0},
    "corpulento": {"weight": 1.0},
    "bajo": {"height": 0.0},
    "alto": {"height": 1.0},
}


def crear(genero, peinado, prenda, cambios):
    """Cuerpo con el pelo y la prenda ya ajustados a él. Devuelve [cuerpo, pelo, prenda] con las formas y la postura aplicadas."""
    macro = TargetService.get_default_macro_info_dict()
    macro.update({"gender": genero, **cambios})
    cuerpo = HumanService.create_human(macro_detail_dict=macro)
    # El esqueleto solo sirve para poner la postura: no se exporta
    esqueleto = HumanService.add_builtin_rig(cuerpo, "default")
    mallas = [cuerpo]
    for carpeta, nombre, tipo in (("hair", peinado, "Hair"), ("clothes", prenda, "Clothes")):
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
    for malla in mallas:
        lugar = malla.matrix_world.copy()
        with bpy.context.temp_override(object=malla, active_object=malla):
            for modificador in [m for m in malla.modifiers if m.type == "ARMATURE"]:
                bpy.ops.object.modifier_apply(modifier=modificador.name)
        malla.parent = None
        malla.matrix_world = lugar
    bpy.data.objects.remove(esqueleto)
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


def material_de_pelo(pelo):
    """Material simple (color y transparencia de la textura), que es lo que entiende el formato web."""
    imagen = next(n.image for m in pelo.data.materials for n in m.node_tree.nodes if n.type == "TEX_IMAGE" and n.image)
    material = bpy.data.materials.new("pelo")
    material.use_nodes = True
    nodos = material.node_tree
    textura = nodos.nodes.new("ShaderNodeTexImage")
    textura.image = imagen
    principal = nodos.nodes["Principled BSDF"]
    nodos.links.new(textura.outputs["Color"], principal.inputs["Base Color"])
    nodos.links.new(textura.outputs["Alpha"], principal.inputs["Alpha"])
    pelo.data.materials.clear()
    pelo.data.materials.append(material)


for archivo, (genero, peinado, prenda) in CUERPOS.items():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    mallas = crear(genero, peinado, prenda, {})
    cuerpo, pelo, ropa = mallas
    for objeto, nombre in zip(mallas, NOMBRES):
        objeto.name = nombre
        objeto.shape_key_add(name="Basis")

    for nombre, cambios in FORMAS.items():
        variantes = crear(genero, peinado, prenda, cambios)
        for base, variante in zip(mallas, variantes):
            copiar_forma(base, variante, nombre)
        for variante in reversed(variantes):
            bpy.data.objects.remove(variante)

    # La malla trae geometría auxiliar (guías para la ropa y las articulaciones) que no es cuerpo
    indice_cuerpo = cuerpo.vertex_groups["body"].index
    malla = bmesh.new()
    malla.from_mesh(cuerpo.data)
    capa = malla.verts.layers.deform.verify()
    bmesh.ops.delete(malla, geom=[v for v in malla.verts if indice_cuerpo not in v[capa]], context="VERTS")
    malla.to_mesh(cuerpo.data)
    malla.free()

    # La prenda trae la lista de vértices del cuerpo que tapa. Esas caras van con otro material para
    # que salgan como pieza aparte y la app las esconda: si no, el cuerpo asoma por la tela ceñida.
    # (la otra máscara del cuerpo, "body", es la que esconde la geometría auxiliar)
    (grupo,) = [m.vertex_group for m in cuerpo.modifiers if m.type == "MASK" and m.vertex_group != "body"]
    tapado = cuerpo.vertex_groups[grupo].index
    cuerpo.data.materials.clear()
    for nombre in ("piel", "tapado"):
        cuerpo.data.materials.append(bpy.data.materials.new(nombre))
    for poligono in cuerpo.data.polygons:
        poligono.material_index = any(g.group == tapado for v in poligono.vertices for g in cuerpo.data.vertices[v].groups)
    # La prenda va sin material: la app le pone el color
    ropa.data.materials.clear()
    material_de_pelo(pelo)
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
