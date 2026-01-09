# Vježba: OpenGL/GLUT animacija (macOS)

## Kratak opis programa
- **Što radi:** Prikazuje dva kvadrata koji se rotiraju u suprotnim smjerovima na bijeloj podlozi.
- **Tehnologije:** OpenGL + GLUT (macOS), C.
- **Datoteka:** `main/main.c`.

## Cilj vježbe
- Vježbati inicijalizaciju i rad s GLUT-om (prozor, callback funkcije).
- Primjena osnovnih 2D/3D transformacija: translacija, rotacija, skaliranje.
- Upravljanje „kamerom” (pomak pogleda) i jednostavna animacija putem `idle()` petlje.

## Opis međusobne povezanosti potprograma / modula
- **`main()`**: inicijalizira GLUT, kreira prozor i registrira callback funkcije.
- **`display()`**: briše ekran i zove `renderScene()` pa mijenja bafer (`glutSwapBuffers`).
- **`reshape(w, h)`**: postavlja projekciju (`glOrtho`), viewport i pogled (`gluLookAt`).
- **`renderScene()`**: crta scenu (dva kvadrata) uz odgovarajuće transformacije.
- **`drawSquare()`**: iscrtava jedan kvadrat pomoću `GL_QUADS`.
- **`idle()`**: povećava kut animacije i traži ponovno iscrtavanje (`glutPostRedisplay`).
- **`keyboard(key, x, y)`**: pomiče „kameru” po X/Y, resetira ili izlazi.

Tok izvršavanja: `main()` → registracija callbacka → GLUT event loop → prema događaju se pozivaju `display()`, `reshape()`, `keyboard()`, `idle()` → `display()` poziva `renderScene()` → `renderScene()` poziva `drawSquare()`.

## Promjene u odnosu na početne upute
- Prevedeni nazivi i poruke na engleski (npr. `ociste` → `eye`, `kut` → `angle`).
- Uvoz na macOS: `#include <GLUT/glut.h>` (umjesto `GL/glut.h`).
- Dodan kratki help za kontrole u konzoli.

## Korištene strukture podataka
- **`Eye`**: opisuje položaj pogleda/kamere.
```c
typedef struct _Eye {
    GLdouble x;
    GLdouble y;
    GLdouble z;
} Eye;
```
- Globalne varijable: `GLuint width, height; int angle; Eye eye;`
  - `angle` upravlja rotacijom objekata.
  - `eye` definira položaj za `gluLookAt`.

## Upute za korištenje programa
- **Tipke**
  - `a / d`: pomak pogleda po X osi
  - `w / s`: pomak pogleda po Y osi
  - `r`: reset pogleda (X=0, Y=0)
  - `Esc`: izlaz

- **Kompajliranje i pokretanje (macOS, sistemski GLUT)**
```bash
# iz foldera gdje je main.c (ovdje: main/)
clang main.c -framework OpenGL -framework GLUT -o animation
./animation
```

- **Ako koristiš Homebrew freeglut**
```bash
brew install freeglut
clang main.c -I/opt/homebrew/include -L/opt/homebrew/lib -lglut -framework OpenGL -o animation
./animation
```

Napomena: macOS prikazuje upozorenja o depreciranosti OpenGL-a – to je očekivano i program će raditi.

## Komentar rezultata
- **Brzina**: na modernim Macovima rendering je „gladak”; fps dovoljno visok za ovu jednostavnu scenu.
- **Osjećaj**: kontrole responzivne; promjena pogleda odmah vidljiva.

## Moguće poboljšanje / problemi / ograničenja
- OpenGL/GLUT na macOS-u je deprecated (Apple preporučuje Metal).
- Nema kontrole dubine (scena je 2D-ish); za 3D treba `GL_DEPTH_TEST` i perspektivu (`gluPerspective`).
- Dodati učitavanje modela, složenije animacije, teksture, GUI izbornik.
- Dodati ograničenja kamere i normalizaciju kuta (već djelomično tu).

## Sažetak build uputa (kratko)
- Ovisi o Xcode Command Line Tools.
- Kompajliraj iz `main/`:
```bash
clang main.c -framework OpenGL -framework GLUT -o animation
./animation
```
- Alternativno (Homebrew freeglut):
```bash
clang main.c -I/opt/homebrew/include -L/opt/homebrew/lib -lglut -framework OpenGL -o animation
./animation
```
