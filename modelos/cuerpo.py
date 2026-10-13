# Genera public/modelos/cuerpo.glb: el cuerpo base de MakeHuman (CC0) con una forma por cada
# extremo de los controles de la app, para mezclarlas en el navegador.
#
# Uso (Blender 5.x con la extensión MPFB instalada), desde la raíz del repositorio:
#   blender -b --python modelos/cuerpo.py
import os

import bmesh
import bpy
from bl_ext.blender_org.mpfb.services.humanservice import HumanService
from bl_ext.blender_org.mpfb.services.targetservice import TargetService

SALIDA = os.path.join(os.getcwd(), "public", "modelos", "cuerpo.glb")

# Cada forma es el cuerpo medio con un solo valor llevado a su extremo (0 o 1; el medio es 0.5)
FORMAS = {
    "delgado": {"weight": 0.0},
    "corpulento": {"weight": 1.0},
    "bajo": {"height": 0.0},
    "alto": {"height": 1.0},
    "femenino": {"gender": 0.0},
    "masculino": {"gender": 1.0},
}


def crear(cambios):
    """Cuerpo con sus formas ya aplicadas a la malla. Devuelve el objeto."""
    macro = TargetService.get_default_macro_info_dict()
    macro.update(cambios)
    cuerpo = HumanService.create_human(macro_detail_dict=macro)
    TargetService.bake_targets(cuerpo)
    return cuerpo


bpy.ops.wm.read_factory_settings(use_empty=True)
base = crear({})
base.name = "cuerpo"
base.shape_key_add(name="Basis")

for nombre, cambios in FORMAS.items():
    variante = crear(cambios)
    assert len(variante.data.vertices) == len(base.data.vertices), nombre
    # Los pies siempre en el suelo: la diferencia de altura va dentro de la forma
    desfase = variante.location - base.location
    forma = base.shape_key_add(name=nombre)
    for v in variante.data.vertices:
        forma.data[v.index].co = v.co + desfase
    bpy.data.objects.remove(variante)

# La malla trae geometría auxiliar (guías para la ropa y las articulaciones) que no es cuerpo
bpy.context.view_layer.objects.active = base
indice_cuerpo = base.vertex_groups["body"].index
malla = bmesh.new()
malla.from_mesh(base.data)
capa = malla.verts.layers.deform.verify()
bmesh.ops.delete(malla, geom=[v for v in malla.verts if indice_cuerpo not in v[capa]], context="VERTS")
malla.to_mesh(base.data)
malla.free()

for modificador in list(base.modifiers):
    base.modifiers.remove(modificador)
base.data.materials.clear()
for poligono in base.data.polygons:
    poligono.use_smooth = True

os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
bpy.ops.object.select_all(action="DESELECT")
base.select_set(True)
bpy.ops.export_scene.gltf(
    filepath=SALIDA,
    use_selection=True,
    export_morph=True,
    export_morph_normal=True,
    export_skins=False,
    export_animations=False,
    export_materials="NONE",
    export_yup=True,
)
print("CUERPO_OK", len(base.data.vertices), "vertices", os.path.getsize(SALIDA), "bytes")
