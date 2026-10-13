# Genera public/modelos/mujer.glb y hombre.glb: el cuerpo base de MakeHuman (CC0) con pelo, y una
# forma por cada extremo de los controles de la app, para mezclarlas en el navegador.
#
# Hace falta Blender 5.x con la extensión MPFB y el paquete de recursos libres de MakeHuman
# ("makehuman_system_assets_cc0.zip") descomprimido; su carpeta se pasa en MAKEHUMAN_ASSETS.
# Uso, desde la raíz del repositorio:
#   MAKEHUMAN_ASSETS=/ruta/al/paquete blender -b --python modelos/cuerpo.py
import os

import bmesh
import bpy
from bl_ext.blender_org.mpfb.services.humanservice import HumanService
from bl_ext.blender_org.mpfb.services.targetservice import TargetService

RECURSOS = os.environ["MAKEHUMAN_ASSETS"]
SALIDA = os.path.join(os.getcwd(), "public", "modelos")

# nombre del archivo -> (valor de "gender" en MakeHuman, peinado)
CUERPOS = {"mujer": (0.0, "long01"), "hombre": (1.0, "short02")}

# Cada forma es el cuerpo base con un solo valor llevado a su extremo (0 o 1; el medio es 0.5)
FORMAS = {
    "delgado": {"weight": 0.0},
    "corpulento": {"weight": 1.0},
    "bajo": {"height": 0.0},
    "alto": {"height": 1.0},
}


def crear(genero, peinado, cambios):
    """Cuerpo con el pelo ya ajustado a él. Devuelve (cuerpo, pelo) con las formas aplicadas a la malla."""
    macro = TargetService.get_default_macro_info_dict()
    macro.update({"gender": genero, **cambios})
    cuerpo = HumanService.create_human(macro_detail_dict=macro)
    antes = set(bpy.data.objects)
    HumanService.add_mhclo_asset(
        os.path.join(RECURSOS, "hair", peinado, peinado + ".mhclo"), cuerpo, asset_type="Hair",
        subdiv_levels=0, set_up_rigging=False, interpolate_weights=False, import_subrig=False, import_weights=False,
    )
    (pelo,) = [o for o in set(bpy.data.objects) - antes if o.type == "MESH"]
    TargetService.bake_targets(cuerpo)
    bpy.context.view_layer.update()
    return cuerpo, pelo


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


for archivo, (genero, peinado) in CUERPOS.items():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    cuerpo, pelo = crear(genero, peinado, {})
    cuerpo.name, pelo.name = "cuerpo", "pelo"
    for objeto in (cuerpo, pelo):
        objeto.shape_key_add(name="Basis")

    for nombre, cambios in FORMAS.items():
        cuerpo_v, pelo_v = crear(genero, peinado, cambios)
        copiar_forma(cuerpo, cuerpo_v, nombre)
        copiar_forma(pelo, pelo_v, nombre)
        bpy.data.objects.remove(pelo_v)
        bpy.data.objects.remove(cuerpo_v)

    # La malla trae geometría auxiliar (guías para la ropa y las articulaciones) que no es cuerpo
    indice_cuerpo = cuerpo.vertex_groups["body"].index
    malla = bmesh.new()
    malla.from_mesh(cuerpo.data)
    capa = malla.verts.layers.deform.verify()
    bmesh.ops.delete(malla, geom=[v for v in malla.verts if indice_cuerpo not in v[capa]], context="VERTS")
    malla.to_mesh(cuerpo.data)
    malla.free()

    cuerpo.data.materials.clear()
    material_de_pelo(pelo)
    for objeto in (cuerpo, pelo):
        for modificador in list(objeto.modifiers):
            objeto.modifiers.remove(modificador)
        for poligono in objeto.data.polygons:
            poligono.use_smooth = True

    os.makedirs(SALIDA, exist_ok=True)
    destino = os.path.join(SALIDA, archivo + ".glb")
    bpy.ops.object.select_all(action="DESELECT")
    cuerpo.select_set(True)
    pelo.select_set(True)
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
    print("CUERPO_OK", archivo, len(cuerpo.data.vertices), len(pelo.data.vertices), os.path.getsize(destino), "bytes")
