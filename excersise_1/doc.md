# Dokumentacija - Vježba 1: Praćenje puta B-spline krivuljom

**Predmet:** Računalna animacija i nova medija (RACANI)  
**Akademska godina:** 2024/2025

---

## 1. Kratak opis programa i međusobna povezanost

### 1.1 Glavni program (`main.c`)

Glavni program sadrži:
- **OpenGL rendering loop** - renderiranje 3D scene, kamere, objekata i krivulje
- **Sustav kontrole** - upravljanje kamerom i objektom preko tipkovnice
- **Animacijski sustav** - kretanje objekta duž B-spline krivulje
- **HUD i izbornici** - prikaz trenutnih parametara i kontrola
- **Demonstracija gimbal lock-a** - vizualizacija problema Eulerovih kutova

### 1.2 Potprogrami i moduli

#### `bspline.c/h` - Matematika B-spline krivulja
- `bspline_evaluate()` - evaluacija pozicije na krivulji (zadatak 2, jednadžba 1.1)
- `bspline_evaluateTangent()` - izračun tangentnog vektora (zadatak 3.3)
- `bspline_computeAxisAngle()` - metoda osi i kuta rotacije (sekcija 1.4, jednadžbe 1.5 i 1.6)
- `bspline_computeFrenetFrame()` - Frenet-Serret sustav (sekcija 1.6, jednadžbe 1.7-1.9)
- `bspline_normalize()` - normalizacija vektora

**Povezanost:** Glavni program poziva ove funkcije svaki frame za izračun pozicije i orijentacije objekta.

#### `obj_loader.c/h` - Učitavanje 3D modela
- `loadOBJ()` - čitanje Wavefront .obj datoteka (zadatak 1)
- `normalizeModel()` - normalizacija modela u jediničnu veličinu
- `drawOBJModel()` - renderiranje trokuta s OpenGL
- `printOBJInfo()` - ispis informacija o modelu

**Povezanost:** Učitava 3D model prilikom inicijalizacije i renderira ga svaki frame.

#### `file_io.c/h` - Generiranje kontrolnih točaka
- `createSpiralPath()` - generira 12 kontrolnih točaka za spiralnu putanju (zadatak 4)
- `printControlPoints()` - ispis kontrolnih točaka za debug

**Povezanost:** Poziva se prilikom inicijalizacije za kreiranje B-spline krivulje.

#### `visualization.c/h` - OpenGL vizualizacija
- `drawBSplineCurve()` - crtanje B-spline krivulje
- `drawControlPolygon()` - crtanje kontrolnog poligona
- `drawTangentVector()` - crtanje tangentnih vektora (zadatak 3.3)
- `drawFrenetFrame()` - crtanje Frenet-Serret sustava (T, N, B vektori)
- `drawGrid()` - crtanje koordinatne mreže
- `drawAxes()` - crtanje koordinatnih osi

**Povezanost:** Glavni program poziva ove funkcije za vizualizaciju krivulje i pomoćnih elemenata.

---

## 2. Promjene načinjene s obzirom na upute

### 2.1 Dodano (nije bilo u originalnim uputama)

1. **Interaktivni sustav kontrole**
   - Mogućnost odabira između upravljanja kamerom ili objektom (tipke O/C)
   - Odabir osi rotacije (tipke X/Y/Z)
   - Rotacija pomoću strelica

2. **Gimbal lock demonstracija**
   - Vizualizacija problema Eulerovih kutova
   - Upozorenje kada Y rotacija dosegne ±90°
   - Prikaz osi objekta (tipka 5) za vizualizaciju problema

3. **HUD informacije**
   - Prikaz trenutnih rotacija objekta (X, Y, Z) s modulo 360°
   - Prikaz brzine animacije
   - Prikaz trenutnog segmenta
   - Status tangenti (uključen/isključen)
   - Upozorenje za gimbal lock

4. **Dodatne mogućnosti prikaza**
   - Wireframe/solid mod (tipka 6)
   - Prikaz osi objekta (tipka 5)
   - Home kamera na ishodište (tipka H)
   - Togglanje pojedinačnih elemenata (krivulja, tangente, točke, mreža)

5. **Kontrola brzine animacije**
   - Tipke +/- za promjenu brzine
   - Reset brzine s tipkom R

### 2.2 Implementirane metode orijentacije (zadatak 3.5)

Implementirane su **obje metode** orijentacije:

1. **Axis-Angle metoda** (zadana, sekcija 1.4)
   - Koristi se u `main.c` linija 358-364
   - Implementacija u `bspline.c`: `bspline_computeAxisAngle()` i `bspline_applyAxisAngle()`
   - Jednadžbe 1.5 i 1.6 iz PDF-a

2. **DCM/Frenet-Serret metoda** (sekcija 1.6)
   - Dostupna u kodu ali trenutno nije aktivna
   - Implementacija u `bspline.c`: `bspline_computeFrenetFrame()` i `bspline_applyFrenetFrame()`
   - Jednadžbe 1.7-1.9 iz PDF-a
   - Može se aktivirati promjenom `orientMode` varijable

**Napomena:** Axis-Angle metoda je zadana jer pruža stabilnije rezultate za spiralnu putanju.

### 2.3 Spiralna putanja (zadatak 4)

Implementirana spirala s **12 kontrolnih točaka** kako je specificirano u zadatku:
- V1=(0,0,0), V2=(0,10,5), V3=(10,10,10), V4=(10,0,15)
- V5=(0,0,20), V6=(0,10,25), V7=(10,10,30), V8=(10,0,35)
- V9=(0,0,40), V10=(0,10,45), V11=(10,10,50), V12=(10,0,55)

Rezultat: **9 B-spline segmenata** (formula: segmenti = točke - 3)

---

## 3. Korištene strukture podataka

### 3.1 Osnovne strukture

```c
// 3D vektor (bspline.h)
typedef struct {
    double x, y, z;
} Vec3;

// Osi i kut rotacije (bspline.h)
typedef struct {
    Vec3 axis;      // Os rotacije (normaliziran vektor)
    double angle;   // Kut rotacije u stupnjevima
} AxisAngle;

// Frenet-Serret sustav (bspline.h)
typedef struct {
    Vec3 T;  // Tangentni vektor (Tangent)
    Vec3 N;  // Normalni vektor (Normal)
    Vec3 B;  // Binormalni vektor (Binormal)
} FrenetFrame;

// 3D model (obj_loader.h)
typedef struct {
    Vec3* vertices;      // Polje vrhova
    int* triangles;      // Polje indeksa trokuta (3 po trokutu)
    int vertexCount;     // Broj vrhova
    int triangleCount;   // Broj trokuta
} OBJModel;
```

### 3.2 Globalne varijable stanja (main.c)

**Animacija:**
- `currentSegment` - trenutni segment krivulje [1, numSegments]
- `t` - parametar u segmentu [0.0, 1.0]
- `tSpeed` - brzina animacije (increment t-a po frame-u)
- `paused` - flag za pauzu

**Kontrolne točke:**
- `controlPoints[]` - polje Vec3 kontrolnih točaka
- `numControlPoints` - broj točaka (12)
- `numSegments` - broj segmenata (9)

**Rotacije:**
- `objectRotationX/Y/Z` - dodatne korisničke rotacije (za gimbal lock demo)
- `cameraAngleX/Y/Z` - kutovi kamere
- `cameraDistance` - udaljenost kamere od ishodišta

**Prikaz:**
- `showCurve/Tangents/ControlPoints/Grid/Axes` - flagovi za togglanje prikaza
- `wireframeMode` - solid/wireframe mod
- `showObjectAxes` - prikaz osi objekta

---

## 4. Upute za korištenje programa

### 4.1 Izgradnja

```bash
cd excersise_1
make
```

### 4.2 Pokretanje

```bash
./exercise1
```

Program će se pokrenuti s automatskom animacijom žabe duž spiralne putanje.

### 4.3 Kontrole

#### Osnovne kontrole
- **O** - Prebaci na mod rotacije objekta
- **C** - Prebaci na mod rotacije kamere
- **X / Y / Z** - Odaberi os za rotaciju
- **Strelica gore/dolje** - Rotiraj odabranu os (ili zoom za Z na kameri)

#### Kontrole animacije
- **P** - Pauza/nastavi animaciju
- **+ / -** - Povećaj/smanji brzinu animacije
- **R** - Resetiraj sve (kamera, objekt, brzina)

#### Kontrole prikaza
- **H** - Vrati kameru na ishodište (0,0,0)
- **1** - Uključi/isključi B-spline krivulju
- **3** - Uključi/isključi kontrolne točke
- **4** - Uključi/isključi mrežu i osi
- **5** - Uključi/isključi osi objekta (RGB = XYZ)
- **6** - Uključi/isključi wireframe mod

#### Izlaz
- **ESC** - Izlaz iz programa

### 4.4 Demonstracija gimbal lock-a

1. Pritisni **P** (pauziraj animaciju)
2. Pritisni **H** (vrati kameru na ishodište)
3. Pritisni **5** (prikaži osi objekta - RGB strelice)
4. Pritisni **O** (prebaci na mod objekta)
5. Pritisni **Y**, zatim **strelicu gore** dok Y ne dosegne ~90°
6. Prikazat će se **CRVENO UPOZORENJE**: "GIMBAL LOCK at Y=90°"
7. Probaj rotirati **X** i **Z** - proizvode identične efekte!

**Objašnjenje:** U XYZ Euler redu rotacija, gimbal lock nastaje kada srednja rotacija (Y) dosegne ±90°, uzrokujući poravnanje X i Z osi.

### 4.5 Promjena 3D modela

Uredi `main.c` liniju ~113:

```c
const char* objFile = "assets/frog.obj";        // Žaba (6308 vrhova)
// const char* objFile = "assets/kocka.obj";     // Kocka (8 vrhova)
// const char* objFile = "assets/tetrahedron.obj"; // Tetraedar (4 vrha)
```

Zatim ponovno prevedi: `make`

---

## 5. Komentar rezultata

### 5.1 Brzina

**Performanse:**
- Program radi glatko na svim testiranim sustavima (60 FPS)
- Žaba model (6308 vrhova, 12612 trokuta) renderira se bez problema
- B-spline evaluacija je efikasna (O(1) po frame-u)

**Brzina animacije:**
- Zadana brzina: `tSpeed = 0.01` (optimalna za gledanje)
- Može se podešavati s +/- tipkama
- Resetira se na zadanu vrijednost s tipkom R

### 5.2 Moguće promjene i proširenja

#### Implementirane ali neaktivne značajke:
1. **Frenet-Serret metoda** - dostupna u kodu, može se aktivirati
2. **Pan kamera** (W/A/S/D tipke) - dostupno ali se rijetko koristi

#### Moguća poboljšanja:
1. **Interpolacija brzine** - trenutno je brzina konstantna
2. **Kamera prati objekt** - automatski prati objekt tijekom animacije
3. **Učitavanje putanje iz datoteke** - trenutno samo spirala
4. **Više modela odjednom** - trenutno samo jedan model
5. **Smoothing između segmenata** - kontinuitet C2 na prijelazima
6. **Shadows i naprednije osvjetljenje**

### 5.3 Poznati problemi

#### 1. Gimbal lock (namjerno demonstriran)
- **Problem:** Na Y = ±90° gubimo jedan stupanj slobode
- **Uzrok:** Korištenje XYZ Euler kutova
- **Rješenje:** Korištenje kvaterniona (nije implementirano)
- **Status:** Ovo je namjerna demonstracija problema

#### 2. Deprecation upozorenja pri kompilaciji
- **Problem:** OpenGL i GLUT su deprecated na macOS 10.9+
- **Uzrok:** Apple potiče Metal umjesto OpenGL
- **Utjecaj:** Program i dalje radi ispravno
- **Status:** Prihvatljivo za akademsku svrhu

#### 3. Frenet-Serret nestabilnost
- **Problem:** Na ravnim dijelovima krivulje normal vektor nije definiran
- **Uzrok:** Zakrivljenost krivulje teži nuli
- **Rješenje:** Korištenje Axis-Angle metode (trenutno aktivna)
- **Status:** Riješeno odabirom metode

### 5.4 Nedostaci

#### Ograničenja implementacije:
1. **Fiksni broj kontrolnih točaka** - hardkodirano na 12
2. **Samo uniform B-spline** - bez support za non-uniform
3. **Samo kubični B-spline** - stepen 3 fiksiran
4. **Jedan objekt** - ne podržava više objekata
5. **Nema fizike** - samo kinematičko kretanje

#### Korisnička sučelje:
1. **Kompleksne kontrole** - potrebno je pritiskati više tipki (O/C, pa X/Y/Z, pa strelice)
2. **Nema GUI** - sve kontrole preko tipkovnice
3. **Nema tooltips** - korisnik mora znati kontrole

### 5.5 Prednosti implementacije

1. **Dobro dokumentiran kod** - svi moduli i funkcije imaju komentare
2. **Modularna struktura** - jasna podjela odgovornosti
3. **Edukativna vrijednost** - jasno demonstrira gimbal lock problem
4. **Interaktivnost** - korisnik može eksperimentirati
5. **Fleksibilnost** - lako promijeniti model ili parametre
6. **Vizualizacija** - prikazuje krivulju, tangente, kontrolne točke i osi

---

## 6. Zaključak

Program uspješno implementira sve zadatke iz vježbe:
- ✅ **Zadatak 1:** Učitavanje OBJ modela
- ✅ **Zadatak 2:** Uniform kubični B-spline interpolacija
- ✅ **Zadatak 3:** Automatska orijentacija objekta duž puta
- ✅ **Zadatak 3.3:** Prikaz tangentnih vektora
- ✅ **Zadatak 3.5:** Implementacija Axis-Angle i Frenet-Serret metoda
- ✅ **Zadatak 4:** Spiralna putanja s 12 kontrolnih točaka

Dodatno, program demonstrira problem gimbal lock-a s Eulerovim kutovima, što ima veliku edukativnu vrijednost.

Program je stabilan, dobro dokumentiran.

---

**Bilješka o izvršnoj verziji:**  
Program koristi samo standardne sistemske biblioteke (OpenGL, GLUT) koje su ugrađene u macOS. Nije potrebna instalacija dodatnih .dll ili shared libraries. Na Linux sustavu potreban je samo `freeglut3` paket.