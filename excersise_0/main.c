#include <stdio.h>
#include <stdlib.h>
#include <math.h>
#include <GLUT/glut.h>   // On macOS, use GLUT/glut.h instead of GL/glut.h

GLuint width = 600, height = 600;
int angle = 0;

typedef struct _Eye {
    GLdouble x;
    GLdouble y;
    GLdouble z;
} Eye;

Eye eye = { 0.0f, 0.0f, 2.0f };

void display();
void reshape(int width, int height);
void drawSquare();
void renderScene();
void idle();
void keyboard(unsigned char key, int mouseX, int mouseY);

int main(int argc, char **argv)
{
    glutInit(&argc, argv);
    glutInitDisplayMode(GLUT_DOUBLE);
    glutInitWindowSize(width, height);
    glutInitWindowPosition(0, 0);
    glutCreateWindow("Animation Example");

    glutDisplayFunc(display);
    glutReshapeFunc(reshape);
    glutIdleFunc(idle);
    glutKeyboardFunc(keyboard);

    printf("Controls:\n");
    printf("  a/d - move camera along X axis\n");
    printf("  w/s - move camera along Y axis\n");
    printf("  r   - reset camera\n");
    printf("  esc - exit\n");

    glutMainLoop();
    return 0;
}

void display()
{
    glClearColor(1.0f, 1.0f, 1.0f, 1.0f);
    glClear(GL_COLOR_BUFFER_BIT);
    renderScene();
    glutSwapBuffers();
}

void reshape(int w, int h)
{
    width = w; height = h;
    glMatrixMode(GL_PROJECTION);
    glLoadIdentity();
    glOrtho(-1, 1, -1, 1, 1, 5);
    glViewport(0, 0, (GLsizei)width, (GLsizei)height);
    glMatrixMode(GL_MODELVIEW);
    glLoadIdentity();
    gluLookAt(eye.x, eye.y, eye.z, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0);
}

void drawSquare()
{
    glBegin(GL_QUADS);
        glVertex3f(-0.4f, -0.4f, 0.0f);
        glVertex3f( 0.4f, -0.4f, 0.0f);
        glVertex3f( 0.4f,  0.4f, 0.0f);
        glVertex3f(-0.4f,  0.4f, 0.0f);
    glEnd();
}

void renderScene()
{
    glColor3f(1.0f, 0.0f, 0.0f);
    glPushMatrix();
        glTranslatef(0.5f, 0.0f, 0.0f);
        glRotatef((float)angle, 0.0f, 0.0f, 1.0f);
        drawSquare();
    glPopMatrix();

    glColor3f(0.0f, 1.0f, 0.0f);
    glPushMatrix();
        glTranslatef(-0.5f, 0.0f, 0.0f);
        glRotatef(-(float)angle, 0.0f, 0.0f, 1.0f);
        drawSquare();
    glPopMatrix();
}

void keyboard(unsigned char key, int mouseX, int mouseY)
{
    switch (key)
    {
        case 'a': eye.x += 0.2f; break;
        case 'd': eye.x -= 0.2f; break;
        case 'w': eye.y += 0.2f; break;
        case 's': eye.y -= 0.2f; break;
        case 'r': eye.x = 0.0f; eye.y = 0.0f; break;
        case 27:  exit(0); break; // ESC key
    }
    reshape(width, height);
    glutPostRedisplay();
}

void idle() {
    angle++;
    if (angle >= 360) angle = 0;
    glutPostRedisplay();
}
