/*
 * ============================================================================
 * B-SPLINE PATH FOLLOWING - EXERCISE 1
 * Computer Animation and New Media (RACANI)
 * ============================================================================
 * 
 * This program demonstrates 3D object animation along a B-spline curve with:
 * - Uniform cubic B-spline interpolation (Task 2)
 * - Automatic object orientation using tangent vectors (Task 3)
 * - Two orientation methods: Axis-Angle and DCM/Frenet (Task 3.5)
 * - 3D spiral path animation (Task 4)
 * - Gimbal lock demonstration with Euler angles
 * 
 * Assignment PDF: vj1a.pdf
 */

#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#ifdef __APPLE__
    #include <GLUT/glut.h>
#else
    #include <GL/glut.h>
#endif

#include "bspline.h"
#include "obj_loader.h"
#include "file_io.h"
#include "visualization.h"

// ============================================================================
// GLOBAL STATE
// ============================================================================

// 3D Model Data (Assignment Section 1.5: Must preserve original coordinates!)
OBJModel* model = NULL;  // Loaded from .obj file (frog, cube, or tetrahedron)

// B-Spline Curve Data (Assignment Task 2)
Vec3* controlPoints = NULL;  // Control points defining the path
int numControlPoints = 0;     // Total number of control points (12 for spiral)
int numSegments = 0;          // Number of curve segments (points - 3)

// Animation State (Assignment Task 3)
int currentSegment = 1;  // Current B-spline segment being traversed [1, numSegments]
float t = 0.0f;          // Parameter within current segment [0.0, 1.0]
float tSpeed = 0.01f;    // Animation speed (how fast t increments per frame)
int paused = 0;          // Animation paused flag (0 = playing, 1 = paused)

// Orientation Mode Selection (Assignment Task 3.5: Compare both methods!)
typedef enum {
    MODE_AXIS_ANGLE,  // Uses equations 1.5 & 1.6 from Section 1.4
    MODE_DCM_FRENET   // Uses equations 1.7-1.9 from Section 1.6 (Frenet-Serret frame)
} OrientationMode;

OrientationMode orientMode = MODE_AXIS_ANGLE;  // Default method

// Display Toggle Options
int showCurve = 1;           // Show B-spline curve path
int showTangents = 1;        // Show tangent vectors along path
int showControlPoints = 1;   // Show control points and control polygon
int showGrid = 1;            // Show XY ground grid
int showAxes = 1;            // Show world coordinate axes (RGB = XYZ)
int showFrenetFrame = 0;     // Show Frenet-Serret frame (T, N, B vectors)
int wireframeMode = 0;       // 0 = solid rendering, 1 = wireframe
int showObjectAxes = 0;      // Show object's local coordinate axes (for gimbal lock visualization)

// Camera Control (Standard 3D viewing)
float cameraDistance = 30.0f;  // Distance from origin
float cameraAngleX = 20.0f;    // Pitch (rotation around X axis)
float cameraAngleY = -30.0f;   // Yaw (rotation around Y axis)
float cameraAngleZ = 0.0f;     // Roll (rotation around Z axis) - rarely used
float cameraPanX = 0.0f;       // Pan left/right
float cameraPanY = 0.0f;       // Pan up/down

// Additional Object Rotation (User-controlled, for gimbal lock demonstration)
// These rotations are applied AFTER the automatic path-following orientation
float objectRotationX = 0.0f;  // Manual pitch rotation (around X axis)
float objectRotationY = 0.0f;  // Manual yaw rotation (around Y axis)
float objectRotationZ = 0.0f;  // Manual roll rotation (around Z axis)

// User Control Mode
typedef enum {
    MODE_CAMERA = 0,  // Arrow keys control camera
    MODE_OBJECT = 1   // Arrow keys control object rotation
} ControlMode;

ControlMode controlMode = MODE_CAMERA;  // Default to camera control

// Axis Selection for Rotation (1=X, 2=Y, 3=Z, 0=none)
int selectedAxis = 0;

// HUD Display
char hudMessage[256] = "Press O (Object) or C (Camera), then X/Y/Z, then arrows";
int showHUD = 1;  // Show on-screen help

// Window Dimensions
int windowWidth = 1024;
int windowHeight = 768;

// ============================================================================
// INITIALIZATION
// ============================================================================

void init() {
    printf("===========================================\n");
    printf("  B-Spline Path Following - Exercise 1\n");
    printf("===========================================\n\n");
    
    // Load OBJ model (task 1)
    // Choose one:
    // const char* objFile = "assets/kocka.obj";        // Simple cube
    // const char* objFile = "assets/tetrahedron.obj";  // Tetrahedron
    const char* objFile = "assets/teddy.obj";         // Complex frog model
    model = loadOBJ(objFile);
    
    if (!model) {
        fprintf(stderr, "Failed to load OBJ model. Exiting.\n");
        exit(1);
    }
    
    // Normalize model to fit nicely
    normalizeModel(model);
    printOBJInfo(model);
    
    // Load control points (task 2)
    // Option 1: Load from file (commented out for task 4)
    // const char* controlFile = "assets/control_points.txt";
    // controlPoints = loadControlPoints(controlFile, &numControlPoints);
    
    // Option 2: Use spiral path (task 4) - ACTIVE NOW!
    controlPoints = createSpiralPath(&numControlPoints);
    
    if (!controlPoints || numControlPoints < 4) {
        fprintf(stderr, "Error: Need at least 4 control points for B-spline curve\n");
        if (controlPoints) free(controlPoints);
        
        // Fallback: create spiral path
        printf("Using fallback spiral path...\n");
        controlPoints = createSpiralPath(&numControlPoints);
    }
    
    printControlPoints(controlPoints, numControlPoints);
    
    // Calculate number of segments (section 1.1)
    numSegments = bspline_getNumSegments(numControlPoints);
    printf("\nB-spline segments: %d\n", numSegments);
    
    if (numSegments <= 0) {
        fprintf(stderr, "Error: Not enough control points for curve\n");
        exit(1);
    }
    
    // OpenGL initialization
    glEnable(GL_DEPTH_TEST);
    glEnable(GL_LIGHTING);
    glEnable(GL_LIGHT0);
    glEnable(GL_COLOR_MATERIAL);
    glColorMaterial(GL_FRONT_AND_BACK, GL_AMBIENT_AND_DIFFUSE);
    
    // Make sure we render FILLED polygons, not wireframe!
    glPolygonMode(GL_FRONT_AND_BACK, GL_FILL);
    
    // Enable face culling for proper rendering
    glEnable(GL_CULL_FACE);
    glCullFace(GL_BACK);
    glFrontFace(GL_CCW);
    
    // Light setup
    GLfloat lightPos[] = {10.0f, 10.0f, 10.0f, 1.0f};
    GLfloat lightAmbient[] = {0.3f, 0.3f, 0.3f, 1.0f};
    GLfloat lightDiffuse[] = {0.8f, 0.8f, 0.8f, 1.0f};
    glLightfv(GL_LIGHT0, GL_POSITION, lightPos);
    glLightfv(GL_LIGHT0, GL_AMBIENT, lightAmbient);
    glLightfv(GL_LIGHT0, GL_DIFFUSE, lightDiffuse);
    
    glClearColor(0.1f, 0.1f, 0.15f, 1.0f);
    
    printf("\n=== SIMPLE CONTROL SYSTEM ===\n");
    printf("\n1. Press O (Object) or C (Camera)\n");
    printf("2. Press X, Y, or Z to select axis\n");
    printf("3. Use arrow keys UP/DOWN to rotate\n");
    printf("\nOther Controls:\n");
    printf("  R - Reset everything (including speed!)\n");
    printf("  P - Pause/Resume\n");
    printf("  +/- - Speed up/down\n");
    printf("  H - Home camera to view origin (0,0,0)\n");
    printf("  1/3/4 - Screen elements (curve/points/grid)\n");
    printf("  5 - Object axes (X/Y/Z arrows on object)\n");
    printf("  6 - Wireframe toggle\n");
    printf("  ESC - Exit\n");
    printf("\n*** Object rotation angles shown in top-left! ***\n");
    printf("*** Tangents display is in object rotation line! ***\n");
    printf("*** Control menu visible on right side! ***\n");
    printf("======================\n\n");
}

// ============================================================================
// HUD AND MENU RENDERING
// ============================================================================

void renderText(float x, float y, const char* text, void* font) {
    glRasterPos2f(x, y);
    while (*text) {
        glutBitmapCharacter(font, *text);
        text++;
    }
}

void renderHUD() {
    if (!showHUD) return;
    
    glDisable(GL_LIGHTING);
    glDisable(GL_DEPTH_TEST);
    
    glMatrixMode(GL_PROJECTION);
    glPushMatrix();
    glLoadIdentity();
    gluOrtho2D(0, windowWidth, 0, windowHeight);
    
    glMatrixMode(GL_MODELVIEW);
    glPushMatrix();
    glLoadIdentity();
    
    // Top left HUD message
    glColor3f(1.0f, 1.0f, 0.0f);  // Yellow
    renderText(10, windowHeight - 20, hudMessage, GLUT_BITMAP_9_BY_15);
    
    // Mode indicator
    char modeText[128];
    snprintf(modeText, sizeof(modeText), "Mode: %s | Axis: %s", 
            controlMode == MODE_OBJECT ? "OBJECT" : "CAMERA",
            selectedAxis == 0 ? "NONE" : (selectedAxis == 1 ? "X" : (selectedAxis == 2 ? "Y" : "Z")));
    glColor3f(0.5f, 1.0f, 0.5f);  // Light green
    renderText(10, windowHeight - 40, modeText, GLUT_BITMAP_9_BY_15);
    
    // Speed and status info
    char statusText[128];
    snprintf(statusText, sizeof(statusText), "Speed: %.3f | Segment: %d/%d | %s", 
            tSpeed, currentSegment, numSegments, paused ? "PAUSED" : "Playing");
    glColor3f(0.7f, 0.7f, 1.0f);  // Light blue
    renderText(10, windowHeight - 60, statusText, GLUT_BITMAP_9_BY_15);
    
    // Object rotation measurements (for gimbal lock detection)
    char rotationText[256];
    float rotX = fmod(objectRotationX, 360.0f);
    float rotY = fmod(objectRotationY, 360.0f);
    float rotZ = fmod(objectRotationZ, 360.0f);
    if (rotX < 0) rotX += 360.0f;
    if (rotY < 0) rotY += 360.0f;
    if (rotZ < 0) rotZ += 360.0f;
    snprintf(rotationText, sizeof(rotationText), "Object Rotation - X: %.1f° | Y: %.1f° | Z: %.1f° | Tangents: %s", 
            rotX, rotY, rotZ, showTangents ? "ON" : "OFF");
    glColor3f(1.0f, 0.7f, 0.3f);  // Orange
    renderText(10, windowHeight - 80, rotationText, GLUT_BITMAP_9_BY_15);
    
    // Gimbal lock warning (XYZ Euler order: lock occurs at Y = ±90°)
    // When Y = 90° or -90°, X and Z axes align - test by rotating X and Z!
    float yNormalized = fmod(objectRotationY, 360.0f);
    if (yNormalized < 0) yNormalized += 360.0f;
    
    // Check for 90° (85-95°) or 270° which is -90° (265-275°)
    if ((yNormalized > 85.0f && yNormalized < 95.0f) || 
        (yNormalized > 265.0f && yNormalized < 275.0f)) {
        glColor3f(1.0f, 0.0f, 0.0f);  // Red warning
        char lockMsg[128];
        float lockAngle = (yNormalized > 180.0f) ? yNormalized - 360.0f : yNormalized;
        snprintf(lockMsg, sizeof(lockMsg), 
                "*** GIMBAL LOCK at Y=%.0f° *** Try rotating X, then Z - they look the same!", 
                lockAngle);
        renderText(10, windowHeight - 100, lockMsg, GLUT_BITMAP_9_BY_15);
    }
    
    glMatrixMode(GL_PROJECTION);
    glPopMatrix();
    glMatrixMode(GL_MODELVIEW);
    glPopMatrix();
    
    glEnable(GL_DEPTH_TEST);
    glEnable(GL_LIGHTING);
}

void renderControlMenu() {
    glDisable(GL_LIGHTING);
    glDisable(GL_DEPTH_TEST);
    
    glMatrixMode(GL_PROJECTION);
    glPushMatrix();
    glLoadIdentity();
    gluOrtho2D(0, windowWidth, 0, windowHeight);
    
    glMatrixMode(GL_MODELVIEW);
    glPushMatrix();
    glLoadIdentity();
    
    int startX = windowWidth - 250;
    int startY = windowHeight - 30;
    int lineHeight = 18;
    int y = startY;
    
    glColor3f(1.0f, 1.0f, 1.0f);  // White
    renderText(startX, y, "=== CONTROLS ===", GLUT_BITMAP_9_BY_15); y -= lineHeight;
    
    glColor3f(0.7f, 0.7f, 0.7f);  // Gray
    renderText(startX, y, "O - Object mode", GLUT_BITMAP_8_BY_13); y -= lineHeight;
    renderText(startX, y, "C - Camera mode", GLUT_BITMAP_8_BY_13); y -= lineHeight;
    renderText(startX, y, "X/Y/Z - Select axis", GLUT_BITMAP_8_BY_13); y -= lineHeight;
    renderText(startX, y, "Arrows - Rotate/Zoom", GLUT_BITMAP_8_BY_13); y -= lineHeight;
    y -= lineHeight / 2;
    renderText(startX, y, "R - Reset all", GLUT_BITMAP_8_BY_13); y -= lineHeight;
    renderText(startX, y, "P - Pause", GLUT_BITMAP_8_BY_13); y -= lineHeight;
    renderText(startX, y, "+/- - Speed", GLUT_BITMAP_8_BY_13); y -= lineHeight;
    renderText(startX, y, "H - View origin", GLUT_BITMAP_8_BY_13); y -= lineHeight;
    y -= lineHeight / 2;
    renderText(startX, y, "1 - Curve", GLUT_BITMAP_8_BY_13); y -= lineHeight;
    renderText(startX, y, "3 - Control Pts", GLUT_BITMAP_8_BY_13); y -= lineHeight;
    renderText(startX, y, "4 - Grid/Axes", GLUT_BITMAP_8_BY_13); y -= lineHeight;
    renderText(startX, y, "5 - Object Axes", GLUT_BITMAP_8_BY_13); y -= lineHeight;
    renderText(startX, y, "6 - Wireframe", GLUT_BITMAP_8_BY_13); y -= lineHeight;
    renderText(startX, y, "ESC - Exit", GLUT_BITMAP_8_BY_13);
    
    glMatrixMode(GL_PROJECTION);
    glPopMatrix();
    glMatrixMode(GL_MODELVIEW);
    glPopMatrix();
    
    glEnable(GL_DEPTH_TEST);
    glEnable(GL_LIGHTING);
}

// ============================================================================
// RENDERING
// ============================================================================

void renderObject() {
    // Task 3.1: Determine position and orientation
    Vec3 pos = bspline_evaluatePosition(controlPoints, currentSegment, t);
    Vec3 tangent = bspline_evaluateTangent(controlPoints, currentSegment, t);
    
    // Draw tangent at current position (task 3.3)
    if (showTangents) {
        drawTangentVector(pos, tangent, 1.0f, NULL);  // Yellow tangent
    }
    
    // Draw Frenet frame if in DCM mode and enabled
    if (orientMode == MODE_DCM_FRENET && showFrenetFrame) {
        FrenetFrame frame = bspline_computeFrenetFrame(controlPoints, currentSegment, t);
        drawFrenetFrame(pos, frame, 1.5f);
    }
    
    // Task 3.2 & 3.4: Transform and render object (section 1.5!)
    glPushMatrix();
        // NOTE: Do NOT use glLoadIdentity() here! It would erase camera transformations!
        // glPushMatrix() already saves the current state (including camera).
        // We apply object transformations ON TOP of camera transformations.
        
        // Task 3.1: Translation (equation 1.2)
        glTranslatef(pos.x, pos.y, pos.z);
        
        // Task 3.1: Orientation        // Orijentacija (ovisno o modu)
        if (orientMode == MODE_AXIS_ANGLE) {
            // FORMULE 1.5 & 1.6: Os rotacije i kut rotacije
            Vec3 startOrientation = {0.0, 0.0, 1.0};
            Vec3 endOrientation = bspline_normalize(tangent);
            AxisAngle rotation = bspline_computeAxisAngle(startOrientation, endOrientation);
            
            bspline_applyAxisAngle(rotation);
        } else {
            // DCM/Frenet metoda (1.6)
            FrenetFrame frame = bspline_computeFrenetFrame(controlPoints, currentSegment, t);
            bspline_applyFrenetFrame(frame);
        }
        
        // Additional object rotations (controlled by arrows + O mode)
        // ROTATION ORDER: X -> Y -> Z (Euler XYZ)
        // GIMBAL LOCK: Occurs at Y = ±90° (middle rotation)
        // At Y=90°: X and Z axes align, lose 1 degree of freedom
        glRotatef(objectRotationX, 1.0f, 0.0f, 0.0f);  // Pitch (1st)
        glRotatef(objectRotationY, 0.0f, 1.0f, 0.0f);  // Yaw (2nd) - GIMBAL LOCK HERE
        glRotatef(objectRotationZ, 0.0f, 0.0f, 1.0f);  // Roll (3rd)
        
        // Skaliranje (optional)
        glScalef(0.5f, 0.5f, 0.5f);
        
        // Set polygon mode based on wireframeMode toggle
        if (wireframeMode) {
            glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);
            glDisable(GL_LIGHTING);  // Wireframe looks better without lighting
        } else {
            glPolygonMode(GL_FRONT_AND_BACK, GL_FILL);
            glEnable(GL_LIGHTING);
        }
        
        // Task 3.4: Draw object (from ORIGINAL coordinates - section 1.5!)
        glColor3f(0.8f, 0.3f, 0.1f);  // Orange color
        drawOBJModel(model);
        
        // Draw object axes if enabled
        if (showObjectAxes) {
            glDisable(GL_LIGHTING);
            glLineWidth(3.0f);
            float axisLength = 2.0f;
            
            // X axis - Red
            glBegin(GL_LINES);
            glColor3f(1.0f, 0.0f, 0.0f);
            glVertex3f(0.0f, 0.0f, 0.0f);
            glVertex3f(axisLength, 0.0f, 0.0f);
            glEnd();
            
            // Y axis - Green
            glBegin(GL_LINES);
            glColor3f(0.0f, 1.0f, 0.0f);
            glVertex3f(0.0f, 0.0f, 0.0f);
            glVertex3f(0.0f, axisLength, 0.0f);
            glEnd();
            
            // Z axis - Blue
            glBegin(GL_LINES);
            glColor3f(0.0f, 0.0f, 1.0f);
            glVertex3f(0.0f, 0.0f, 0.0f);
            glVertex3f(0.0f, 0.0f, axisLength);
            glEnd();
            
            glLineWidth(1.0f);
            glEnable(GL_LIGHTING);
        }
        
        // Restore settings
        if (wireframeMode) {
            glEnable(GL_LIGHTING);
        }
    glPopMatrix();
}

void display() {
    glClear(GL_COLOR_BUFFER_BIT | GL_DEPTH_BUFFER_BIT);
    
    // Setup camera
    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();
    
    // Camera transformation (order matters!)
    glTranslatef(0.0f, 0.0f, -cameraDistance);   // Zoom
    glRotatef(cameraAngleX, 1.0f, 0.0f, 0.0f);   // Pitch (up/down)
    glRotatef(cameraAngleY, 0.0f, 1.0f, 0.0f);   // Yaw (left/right)
    glTranslatef(cameraPanX, cameraPanY, 0.0f);  // Pan
    
    // Draw reference elements
    if (showGrid) {
        glDisable(GL_LIGHTING);
        drawGrid(20.0f, 2.0f, NULL);
        glEnable(GL_LIGHTING);
    }
    
    if (showAxes) {
        glDisable(GL_LIGHTING);
        drawAxes(3.0f);
        glEnable(GL_LIGHTING);
    }
    
    // Task 3.3: Draw B-spline curve
    if (showCurve) {
        glDisable(GL_LIGHTING);
        drawBSplineCurve(controlPoints, numSegments, NULL);
        glEnable(GL_LIGHTING);
    }
    
    // Draw control points
    if (showControlPoints) {
        glDisable(GL_LIGHTING);
        drawControlPoints(controlPoints, numControlPoints, 8.0f, NULL);
        drawControlPolygon(controlPoints, numControlPoints, NULL);
        glEnable(GL_LIGHTING);
    }
    
    // Render animated object
    renderObject();
    
    // Render HUD (top left - status messages)
    renderHUD();
    
    // Render control menu (right side)
    renderControlMenu();
    
    glutSwapBuffers();
}

void reshape(int w, int h) {
    windowWidth = w;
    windowHeight = h;
    
    glViewport(0, 0, w, h);
    
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    gluPerspective(45.0, (double)w / (double)h, 0.1, 1000.0);
    
    glMatrixMode(GL_MODELVIEW);
}

// ============================================================================
// ANIMATION
// ============================================================================

void idle() {
    if (paused) return;
    
    // Section 1.5: Only parameter changes, NOT object coordinates!
    t += tSpeed;
    
    if (t >= 1.0f) {
        t -= 1.0f;
        currentSegment++;
        
        // Loop back to start
        if (currentSegment > numSegments) {
            currentSegment = 1;
        }
    }
    
    glutPostRedisplay();
}

// ============================================================================
// INPUT HANDLING
// ============================================================================

void keyboard(unsigned char key, int x, int y) {
    switch (key) {
        case 'p':  // Pause/resume animation
        case 'P':
            paused = !paused;
            printf("Animation %s\n", paused ? "paused" : "resumed");
            break;
            
        case '+':  // Speed up
        case '=':
            tSpeed += 0.002f;
            printf("Speed: %.3f\n", tSpeed);
            break;
            
        case '-':  // Slow down
        case '_':
            tSpeed -= 0.002f;
            if (tSpeed < 0.001f) tSpeed = 0.001f;
            printf("Speed: %.3f\n", tSpeed);
            break;
            
        case '1':  // Toggle curve display
            showCurve = !showCurve;
            printf("Curve: %s\n", showCurve ? "ON" : "OFF");
            break;
            
        case '2':  // Toggle tangents
            showTangents = !showTangents;
            printf("Tangents: %s\n", showTangents ? "ON" : "OFF");
            break;
            
        case '3':  // Toggle control points
            showControlPoints = !showControlPoints;
            printf("Control points: %s\n", showControlPoints ? "ON" : "OFF");
            break;
            
        case '4':  // Toggle grid and axes
            showGrid = !showGrid;
            showAxes = !showAxes;
            printf("Grid and axes: %s\n", showGrid ? "ON" : "OFF");
            break;
            
        case '5':  // Toggle object axes
            showObjectAxes = !showObjectAxes;
            printf("Object axes: %s\n", showObjectAxes ? "ON" : "OFF");
            break;
            
        case '6':  // Toggle wireframe/solid mode
            wireframeMode = !wireframeMode;
            printf("Rendering mode: %s\n", wireframeMode ? "WIREFRAME" : "SOLID");
            break;
            
        case 'g':  // Toggle grid
        case 'G':
            showGrid = !showGrid;
            break;
            
        case 'b':  // Toggle axes (changed from X which is now zoom)
        case 'B':
            showAxes = !showAxes;
            break;
            
        case 'r':  // Reset EVERYTHING
        case 'R':
            // Reset animation
            currentSegment = 1;
            t = 0.0f;
            paused = 0;
            tSpeed = 0.01f;  // Reset speed to default
            // Reset camera
            cameraDistance = 30.0f;
            cameraAngleX = 20.0f;
            cameraAngleY = -30.0f;
            cameraAngleZ = 0.0f;
            cameraPanX = 0.0f;
            cameraPanY = 0.0f;
            // Reset object rotation
            objectRotationX = 0.0f;
            objectRotationY = 0.0f;
            objectRotationZ = 0.0f;
            // Reset control state
            controlMode = MODE_CAMERA;
            selectedAxis = 0;
            snprintf(hudMessage, sizeof(hudMessage), "RESET! Press O or C, then X/Y/Z");
            printf("Everything reset! (including speed)\n");
            break;
            
        case 'w':  // Pan camera up
        case 'W':
            cameraPanY -= 1.0f;
            break;
            
        case 's':  // Pan camera down
        case 'S':
            cameraPanY += 1.0f;
            break;
            
        case 'a':  // Pan camera left
        case 'A':
            cameraPanX += 1.0f;
            break;
            
        case 'd':  // Pan camera right
        case 'D':
            cameraPanX -= 1.0f;
            break;
            
        case 'h':  // Home - Set camera to view 0,0,0
        case 'H':
            cameraDistance = 30.0f;
            cameraAngleX = 0.0f;
            cameraAngleY = 0.0f;
            cameraAngleZ = 0.0f;
            cameraPanX = 0.0f;
            cameraPanY = 0.0f;
            printf("Camera set to view origin (0,0,0)\n");
            break;
            
        case 'o':  // Object mode
        case 'O':
            controlMode = MODE_OBJECT;
            snprintf(hudMessage, sizeof(hudMessage), "Mode: OBJECT | Select axis: X, Y, or Z");
            printf("Switched to OBJECT mode\n");
            break;
            
        case 'c':  // Camera mode
            controlMode = MODE_CAMERA;
            snprintf(hudMessage, sizeof(hudMessage), "Mode: CAMERA | Select axis: X, Y, or Z");
            printf("Switched to CAMERA mode\n");
            break;
            
        case 'x':  // Select X axis
        case 'X':
            selectedAxis = 1;
            snprintf(hudMessage, sizeof(hudMessage), "Mode: %s | Axis: X | Use ↑↓ arrows",
                    controlMode == MODE_OBJECT ? "OBJECT" : "CAMERA");
            printf("X axis selected\n");
            break;
            
        case 'y':  // Select Y axis
        case 'Y':
            selectedAxis = 2;
            snprintf(hudMessage, sizeof(hudMessage), "Mode: %s | Axis: Y | Use ↑↓ arrows",
                    controlMode == MODE_OBJECT ? "OBJECT" : "CAMERA");
            printf("Y axis selected\n");
            break;
            
        case 'z':  // Select Z axis
        case 'Z':
            selectedAxis = 3;
            snprintf(hudMessage, sizeof(hudMessage), "Mode: %s | Axis: Z | Use ↑↓ arrows",
                    controlMode == MODE_OBJECT ? "OBJECT" : "CAMERA");
            printf("Z axis selected\n");
            break;
            
            
        case 27:  // ESC - exit
            printf("Exiting...\n");
            if (model) freeOBJModel(model);
            if (controlPoints) free(controlPoints);
            exit(0);
            break;
    }
    
    glutPostRedisplay();
}

void specialKeys(int key, int x, int y) {
    // Only respond to UP and DOWN arrows
    if (key != GLUT_KEY_UP && key != GLUT_KEY_DOWN) {
        return;
    }
    
    // Check if axis is selected
    if (selectedAxis == 0) {
        snprintf(hudMessage, sizeof(hudMessage), "Select axis first! Press X, Y, or Z");
        return;
    }
    
    float delta = (key == GLUT_KEY_UP) ? 5.0f : -5.0f;
    const char* axisName[] = {"", "X", "Y", "Z"};
    const char* action = (key == GLUT_KEY_UP) ? "Increasing" : "Decreasing";
    
    if (controlMode == MODE_OBJECT) {
        // Object rotation
        if (selectedAxis == 1) {  // X axis
            objectRotationX += delta;
            snprintf(hudMessage, sizeof(hudMessage), "%s OBJECT Pitch (X): %.1f°", action, objectRotationX);
        } else if (selectedAxis == 2) {  // Y axis
            objectRotationY += delta;
            snprintf(hudMessage, sizeof(hudMessage), "%s OBJECT Yaw (Y): %.1f°", action, objectRotationY);
        } else if (selectedAxis == 3) {  // Z axis
            objectRotationZ += delta;
            snprintf(hudMessage, sizeof(hudMessage), "%s OBJECT Roll (Z): %.1f°", action, objectRotationZ);
        }
    } else {
        // Camera rotation/zoom
        if (selectedAxis == 1) {  // X axis
            cameraAngleX += delta;
            snprintf(hudMessage, sizeof(hudMessage), "%s CAMERA Pitch (X): %.1f°", action, cameraAngleX);
        } else if (selectedAxis == 2) {  // Y axis
            cameraAngleY += delta;
            snprintf(hudMessage, sizeof(hudMessage), "%s CAMERA Yaw (Y): %.1f°", action, cameraAngleY);
        } else if (selectedAxis == 3) {  // Z axis - Zoom
            cameraDistance -= delta * 0.5f;
            if (cameraDistance < 5.0f) cameraDistance = 5.0f;
            if (cameraDistance > 100.0f) cameraDistance = 100.0f;
            snprintf(hudMessage, sizeof(hudMessage), "%s CAMERA Zoom (Z): %.1f", 
                    (delta > 0) ? "Decreasing" : "Increasing", cameraDistance);
        }
    }
    
    glutPostRedisplay();
}

// ============================================================================
// MAIN
// ============================================================================

int main(int argc, char** argv) {
    // Initialize GLUT
    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_DOUBLE | GLUT_RGB | GLUT_DEPTH);
    glutInitWindowSize(windowWidth, windowHeight);
    glutInitWindowPosition(100, 100);
    glutCreateWindow("Exercise 1: B-Spline Path Following");
    
    // Initialize application
    init();
    
    // Register callbacks
    glutDisplayFunc(display);
    glutReshapeFunc(reshape);
    glutIdleFunc(idle);
    glutKeyboardFunc(keyboard);
    glutSpecialFunc(specialKeys);
    
    // Start main loop
    printf("Starting animation...\n\n");
    glutMainLoop();
    
    return 0;
}
