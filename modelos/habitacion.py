# Genera public/modelos/habitacion.glb: la habitación en la que está el maniquí. Suelo de madera,
# paredes con rodapié, una ventana que da luz, una alfombra y un armario abierto. Colores lisos, sin
# texturas, para que pese poco.
# Uso, desde la raíz del repositorio:
#   blender -b --python modelos/habitacion.py
# Medidas en metros. El maniquí está en el origen, de cara a la cámara (hacia -Y en Blender, que
# en la web es +Z). La pared del fondo queda detrás de él.
import math
import os

import bpy

SALIDA = os.path.join(os.getcwd(), "public", "modelos", "habitacion.glb")
ANCHO, FONDO, DELANTE, ALTO = 4.4, 1.6, 2.4, 2.7  # el suelo va de y = -DELANTE a y = FONDO


def material(nombre, color, rugosidad=0.7, luz=0.0):
    m = bpy.data.materials.new(nombre)
    m.use_nodes = True
    principal = m.node_tree.nodes["Principled BSDF"]
    principal.inputs["Base Color"].default_value = (*color, 1)
    principal.inputs["Roughness"].default_value = rugosidad
    if luz:
        principal.inputs["Emission Color"].default_value = (*color, 1)
        principal.inputs["Emission Strength"].default_value = luz
    return m


def caja(nombre, centro, medidas, mat, bisel=0.0):
    """Un bloque de `medidas` (ancho, fondo, alto) con su centro en `centro`."""
    bpy.ops.mesh.primitive_cube_add(location=centro)
    objeto = bpy.context.object
    objeto.name = nombre
    objeto.scale = [m / 2 for m in medidas]
    bpy.ops.object.transform_apply(scale=True)
    if bisel:
        modificador = objeto.modifiers.new("bisel", "BEVEL")
        modificador.width = bisel
        modificador.segments = 2
    objeto.data.materials.append(mat)
    return objeto


bpy.ops.wm.read_factory_settings(use_empty=True)

madera = material("madera", (0.62, 0.45, 0.30), 0.55)
pared = material("pared", (0.86, 0.83, 0.78), 0.9)
blanco = material("blanco", (0.93, 0.92, 0.90), 0.5)
roble = material("roble", (0.72, 0.56, 0.40), 0.6)
hueco = material("hueco", (0.35, 0.27, 0.20), 0.8)
metal = material("metal", (0.75, 0.75, 0.73), 0.3)
alfombra = material("alfombra", (0.66, 0.52, 0.44), 1.0)
ventana = material("ventana", (0.85, 0.90, 0.95), 0.5, luz=1.5)

profundo = FONDO + DELANTE
caja("suelo", (0, (FONDO - DELANTE) / 2, -0.05), (ANCHO, profundo, 0.1), madera)
caja("pared_fondo", (0, FONDO + 0.05, ALTO / 2), (ANCHO + 0.2, 0.1, ALTO), pared)
for lado in (-1, 1):
    caja("pared", (lado * (ANCHO / 2 + 0.05), (FONDO - DELANTE) / 2, ALTO / 2), (0.1, profundo, ALTO), pared)
    caja("rodapie", (lado * (ANCHO / 2 - 0.01), (FONDO - DELANTE) / 2, 0.05), (0.02, profundo, 0.1), blanco)
caja("rodapie", (0, FONDO - 0.01, 0.05), (ANCHO, 0.02, 0.1), blanco)

# La ventana, a la izquierda del fondo: un cristal que da luz con su marco
caja("ventana", (-1.15, FONDO - 0.005, 1.55), (0.9, 0.01, 1.3), ventana)
for x, z, ancho, alto in ((-1.15, 0.88, 1.0, 0.06), (-1.15, 2.22, 1.0, 0.06), (-1.62, 1.55, 0.06, 1.4), (-0.68, 1.55, 0.06, 1.4), (-1.15, 1.55, 0.04, 1.3)):
    caja("marco", (x, FONDO - 0.02, z), (ancho, 0.04, alto), blanco)

# La alfombra bajo el maniquí, de un centímetro
caja("alfombra", (0, 0.1, 0.005), (1.7, 1.2, 0.01), alfombra, bisel=0.004)

# El armario, a la derecha del fondo, con las puertas abiertas y la barra para las perchas
X, ANCHO_A, FONDO_A, ALTO_A, GROSOR = 1.25, 1.3, 0.6, 2.2, 0.03
y_a = FONDO - FONDO_A / 2
caja("armario_fondo", (X, FONDO - GROSOR / 2, ALTO_A / 2), (ANCHO_A, GROSOR, ALTO_A), hueco)
for lado in (-1, 1):
    caja("armario_lado", (X + lado * (ANCHO_A / 2 - GROSOR / 2), y_a, ALTO_A / 2), (GROSOR, FONDO_A, ALTO_A), roble, bisel=0.005)
caja("armario_techo", (X, y_a, ALTO_A - GROSOR / 2), (ANCHO_A, FONDO_A, GROSOR), roble, bisel=0.005)
caja("armario_suelo", (X, y_a, 0.08), (ANCHO_A, FONDO_A, GROSOR), roble, bisel=0.005)
caja("armario_balda", (X, y_a, 1.85), (ANCHO_A - 2 * GROSOR, FONDO_A - GROSOR, 0.02), roble)
caja("armario_zocalo", (X, y_a + 0.02, 0.035), (ANCHO_A, FONDO_A - 0.04, 0.07), hueco)
bpy.ops.mesh.primitive_cylinder_add(radius=0.012, depth=ANCHO_A - 2 * GROSOR, location=(X, y_a, 1.72), rotation=(0, math.pi / 2, 0))
bpy.context.object.name = "barra"
bpy.context.object.data.materials.append(metal)
# Cada puerta gira 110° sobre su bisagra, en el borde delantero del armario
for lado in (-1, 1):
    puerta = caja("puerta", (lado * ANCHO_A / 4, -0.01, 0), (ANCHO_A / 2 - 0.004, 0.02, ALTO_A - 0.1), roble, bisel=0.004)
    puerta.location = (X + lado * ANCHO_A / 2, FONDO - FONDO_A, ALTO_A / 2 + 0.03)
    puerta.rotation_euler = (0, 0, lado * math.radians(110))
    bpy.ops.mesh.primitive_cylinder_add(radius=0.008, depth=0.25, location=(lado * (ANCHO_A / 2 - 0.06), -0.05, 0))
    tirador = bpy.context.object
    tirador.data.materials.append(metal)
    tirador.parent = puerta

# Todo junto en una sola malla: menos llamadas de dibujo en el móvil
bpy.ops.object.select_all(action="SELECT")
for objeto in bpy.context.selected_objects:
    bpy.context.view_layer.objects.active = objeto
    for modificador in list(objeto.modifiers):
        bpy.ops.object.modifier_apply(modifier=modificador.name)
bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.context.view_layer.objects.active = bpy.data.objects["suelo"]
bpy.ops.object.join()
bpy.context.object.name = "habitacion"

os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=SALIDA, export_yup=True, export_apply=True)
print("HABITACION_OK", len(bpy.context.object.data.vertices), os.path.getsize(SALIDA), "bytes")
