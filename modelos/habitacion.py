# Genera public/modelos/habitacion.glb: el dormitorio en el que está el maniquí. Suelo de tablas,
# paredes cálidas con rodapié y techo, una ventana con cortinas, una cama, una mesilla con su lámpara,
# una planta, un cuadro, una alfombra y un armario abierto. Colores lisos, sin texturas, para que
# pese poco.
# Uso, desde la raíz del repositorio:
#   blender -b --python modelos/habitacion.py
# Medidas en metros. El maniquí está en el origen, de cara a la cámara (hacia -Y en Blender, que
# en la web es +Z). La pared del fondo queda detrás de él.
import math
import os
import random

import bpy

SALIDA = os.path.join(os.getcwd(), "public", "modelos", "habitacion.glb")
ANCHO, FONDO, DELANTE, ALTO = 6.0, 2.6, 2.6, 2.7  # el suelo va de y = -DELANTE a y = FONDO
random.seed(1)  # las tablas salen siempre igual


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
        modificador.segments = 3
    objeto.data.materials.append(mat)
    return objeto


def cilindro(nombre, centro, radio, alto, mat, radio_arriba=None, lados=24):
    bpy.ops.mesh.primitive_cone_add(vertices=lados, radius1=radio, radius2=radio if radio_arriba is None else radio_arriba, depth=alto, location=centro)
    objeto = bpy.context.object
    objeto.name = nombre
    objeto.data.materials.append(mat)
    return objeto


def cortina(centro_x, ancho, mat):
    """Una tela que cuelga del techo de la ventana, con pliegues."""
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=int(ancho * 40), y_subdivisions=2, size=1)
    tela = bpy.context.object
    tela.name = "cortina"
    tela.scale = (ancho, 2.45, 1)
    bpy.ops.object.transform_apply(scale=True)
    tela.rotation_euler = (math.pi / 2, 0, 0)
    tela.location = (centro_x, FONDO - 0.12, 2.45 / 2 + 0.12)
    for v in tela.data.vertices:
        v.co.z = 0.035 * math.sin(v.co.x * 2 * math.pi / 0.12)  # un pliegue cada 12 cm
    tela.data.materials.append(mat)
    return tela


bpy.ops.wm.read_factory_settings(use_empty=True)

tablas = [material(f"tabla{i}", color, 0.55) for i, color in enumerate(((0.60, 0.42, 0.27), (0.55, 0.38, 0.24), (0.64, 0.47, 0.31)))]
juntas = material("juntas", (0.25, 0.17, 0.11), 0.9)
pared = material("pared", (0.80, 0.72, 0.63), 0.9)
techo = material("techo", (0.92, 0.90, 0.86), 0.9)
blanco = material("blanco", (0.93, 0.92, 0.90), 0.5)
roble = material("roble", (0.70, 0.53, 0.36), 0.6)
nogal = material("nogal", (0.36, 0.24, 0.16), 0.6)
hueco = material("hueco", (0.33, 0.25, 0.18), 0.8)
metal = material("metal", (0.75, 0.73, 0.70), 0.3)
alfombra = material("alfombra", (0.72, 0.60, 0.50), 1.0)
lino = material("lino", (0.90, 0.86, 0.78), 0.95)
edredon = material("edredon", (0.62, 0.66, 0.58), 0.95)
almohada = material("almohada", (0.94, 0.92, 0.88), 0.95)
manta = material("manta", (0.72, 0.45, 0.33), 1.0)
barro = material("barro", (0.65, 0.36, 0.24), 0.8)
hojas = material("hojas", (0.22, 0.38, 0.20), 0.7)
ventana = material("ventana", (0.86, 0.90, 0.95), 0.5, luz=1.4)
pantalla = material("pantalla", (1.0, 0.82, 0.58), 0.8, luz=2.0)
cuadro = [material(f"cuadro{i}", color, 0.8) for i, color in enumerate(((0.78, 0.55, 0.38), (0.36, 0.45, 0.42), (0.88, 0.80, 0.66)))]

# El suelo: tablas de 18 cm a lo largo, en trozos de largo variable y tres tonos, sobre juntas oscuras
profundo = FONDO + DELANTE
caja("juntas", (0, (FONDO - DELANTE) / 2, -0.05), (ANCHO, profundo, 0.06), juntas)
x = -ANCHO / 2
while x < ANCHO / 2 - 0.01:
    ancho = min(0.18, ANCHO / 2 - x)
    y = -DELANTE + random.uniform(-1.0, 0)
    while y < FONDO:
        largo = random.uniform(1.2, 2.2)
        desde, hasta = max(y, -DELANTE), min(y + largo, FONDO)
        caja("tabla", (x + ancho / 2, (desde + hasta) / 2, -0.01), (ancho - 0.004, hasta - desde - 0.004, 0.02), random.choice(tablas))
        y += largo
    x += ancho

# Paredes, techo y rodapiés
caja("pared_fondo", (0, FONDO + 0.05, ALTO / 2), (ANCHO + 0.2, 0.1, ALTO), pared)
caja("techo", (0, (FONDO - DELANTE) / 2, ALTO + 0.05), (ANCHO + 0.2, profundo, 0.1), techo)
for lado in (-1, 1):
    caja("pared", (lado * (ANCHO / 2 + 0.05), (FONDO - DELANTE) / 2, ALTO / 2), (0.1, profundo, ALTO), pared)
    caja("rodapie", (lado * (ANCHO / 2 - 0.01), (FONDO - DELANTE) / 2, 0.06), (0.02, profundo, 0.1), blanco)
caja("rodapie", (0, FONDO - 0.01, 0.06), (ANCHO, 0.02, 0.1), blanco)

# La ventana, a la izquierda del fondo, con su marco y una cortina a cada lado
VX = -1.5
caja("ventana", (VX, FONDO - 0.005, 1.5), (1.1, 0.01, 1.4), ventana)
for cx, cz, ancho, alto in ((VX, 0.77, 1.2, 0.06), (VX, 2.23, 1.2, 0.06), (VX - 0.58, 1.5, 0.06, 1.5), (VX + 0.58, 1.5, 0.06, 1.5), (VX, 1.5, 0.04, 1.4)):
    caja("marco", (cx, FONDO - 0.02, cz), (ancho, 0.04, alto), blanco)
caja("alfeizar", (VX, FONDO - 0.07, 0.75), (1.3, 0.14, 0.03), blanco)
cilindro("riel", (VX, FONDO - 0.12, 2.45), 0.012, 2.0, metal).rotation_euler = (0, math.pi / 2, 0)
for lado in (-1, 1):
    cortina(VX + lado * 0.78, 0.45, lino)

# La cama, contra la pared de la izquierda, con el cabecero en la pared del fondo
BX, BY = -2.2, FONDO - 1.05  # centro de la cama
caja("cabecero", (BX, FONDO - 0.04, 0.6), (1.5, 0.06, 1.0), nogal, bisel=0.01)
caja("somier", (BX, BY, 0.17), (1.5, 2.0, 0.26), nogal, bisel=0.01)
caja("colchon", (BX, BY, 0.4), (1.4, 1.95, 0.22), almohada, bisel=0.05)
caja("edredon", (BX, BY - 0.25, 0.52), (1.5, 1.5, 0.08), edredon, bisel=0.035)
caja("manta", (BX, BY - 0.75, 0.57), (1.52, 0.45, 0.04), manta, bisel=0.02)
for lado in (-1, 1):
    caja("almohada", (BX + lado * 0.35, FONDO - 0.3, 0.6), (0.6, 0.35, 0.16), almohada, bisel=0.07)

# La mesilla, junto a la cama, con una lámpara encendida
MX = BX + 1.05
caja("mesilla", (MX, FONDO - 0.25, 0.27), (0.48, 0.42, 0.54), roble, bisel=0.01)
caja("cajon", (MX, FONDO - 0.465, 0.36), (0.4, 0.01, 0.16), nogal)
cilindro("pie", (MX, FONDO - 0.25, 0.62), 0.07, 0.16, barro)
cilindro("pantalla", (MX, FONDO - 0.25, 0.81), 0.17, 0.22, pantalla, radio_arriba=0.11)

# Un cuadro sobre la cama, en la pared de la izquierda
caja("marco_cuadro", (-ANCHO / 2 + 0.02, BY, 1.65), (0.03, 0.9, 0.65), nogal)
for i, (dy, dz, ay, az) in enumerate(((-0.18, 0.05, 0.35, 0.45), (0.17, 0.1, 0.3, 0.3), (0.17, -0.15, 0.3, 0.15))):
    caja("pintura", (-ANCHO / 2 + 0.04, BY + dy, 1.65 + dz), (0.01, ay, az), cuadro[i])

# Una planta en una maceta, entre la ventana y el armario
PX = 0.85
cilindro("maceta", (PX, FONDO - 0.3, 0.2), 0.17, 0.4, barro, radio_arriba=0.2)
for i in range(9):
    angulo = i * 2.4
    radio = 0.08 + 0.02 * (i % 3)
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=2, radius=random.uniform(0.13, 0.19), location=(PX + radio * math.cos(angulo), FONDO - 0.3 + radio * math.sin(angulo), 0.55 + 0.09 * i))
    bpy.context.object.scale = (1, 1, 1.3)
    bpy.context.object.data.materials.append(hojas)

# La alfombra bajo el maniquí, de 8 mm sobre el suelo, que está a la altura 0
caja("alfombra", (0, 0.2, 0.004), (2.4, 1.7, 0.008), alfombra, bisel=0.003)

# El armario, a la derecha del fondo, con las puertas abiertas y la barra para las perchas
X, ANCHO_A, FONDO_A, ALTO_A, GROSOR = 1.9, 1.6, 0.6, 2.25, 0.03
y_a = FONDO - FONDO_A / 2
caja("armario_fondo", (X, FONDO - GROSOR / 2, ALTO_A / 2), (ANCHO_A, GROSOR, ALTO_A), hueco)
for lado in (-1, 1):
    caja("armario_lado", (X + lado * (ANCHO_A / 2 - GROSOR / 2), y_a, ALTO_A / 2), (GROSOR, FONDO_A, ALTO_A), roble, bisel=0.005)
caja("armario_techo", (X, y_a, ALTO_A - GROSOR / 2), (ANCHO_A, FONDO_A, GROSOR), roble, bisel=0.005)
caja("armario_suelo", (X, y_a, 0.08), (ANCHO_A, FONDO_A, GROSOR), roble, bisel=0.005)
caja("armario_balda", (X, y_a, 1.9), (ANCHO_A - 2 * GROSOR, FONDO_A - GROSOR, 0.02), roble)
caja("armario_zocalo", (X, y_a + 0.02, 0.035), (ANCHO_A, FONDO_A - 0.04, 0.07), hueco)
cilindro("barra", (X, y_a, 1.76), 0.012, ANCHO_A - 2 * GROSOR, metal).rotation_euler = (0, math.pi / 2, 0)
# Cada puerta gira 110° sobre su bisagra, en el borde delantero del armario
for lado in (-1, 1):
    puerta = caja("puerta", (lado * ANCHO_A / 4, -0.01, 0), (ANCHO_A / 2 - 0.004, 0.02, ALTO_A - 0.1), roble, bisel=0.004)
    puerta.location = (X + lado * ANCHO_A / 2, FONDO - FONDO_A, ALTO_A / 2 + 0.03)
    puerta.rotation_euler = (0, 0, lado * math.radians(110))
    tirador = cilindro("tirador", (lado * (ANCHO_A / 2 - 0.06), -0.05, 0), 0.008, 0.25, metal, lados=12)
    tirador.parent = puerta

# Todo junto en una sola malla: menos llamadas de dibujo en el móvil
bpy.ops.object.select_all(action="SELECT")
for objeto in bpy.context.selected_objects:
    bpy.context.view_layer.objects.active = objeto
    for modificador in list(objeto.modifiers):
        bpy.ops.object.modifier_apply(modifier=modificador.name)
bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
bpy.context.view_layer.objects.active = bpy.data.objects["juntas"]
bpy.ops.object.join()
bpy.context.object.name = "habitacion"
for poligono in bpy.context.object.data.polygons:
    poligono.use_smooth = False  # cajas: caras planas

os.makedirs(os.path.dirname(SALIDA), exist_ok=True)
bpy.ops.export_scene.gltf(filepath=SALIDA, export_yup=True, export_apply=True, export_texcoords=False)  # sin texturas, no hacen falta
print("HABITACION_OK", len(bpy.context.object.data.vertices), os.path.getsize(SALIDA), "bytes")
