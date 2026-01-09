#include "visualization.h"
#include <stddef.h>  // For NULL

#ifdef __APPLE__
    #include <GLUT/glut.h>
#else
    #include <GL/glut.h>
#endif

// ============================================================================
// VISUALIZATION HELPER FUNCTIONS
// ============================================================================

void drawBSplineCurve(const Vec3* controlPoints, int numSegments, const float* color) {
    if (!controlPoints || numSegments <= 0) return;
    
    // Default color: gray
    if (color) {
        glColor3fv(color);
    } else {
        glColor3f(0.5f, 0.5f, 0.5f);
    }
    
    glLineWidth(2.0f);
    
    // Draw each segment
    for (int seg = 1; seg <= numSegments; seg++) {
        glBegin(GL_LINE_STRIP);
        for (float t = 0.0f; t <= 1.0f; t += 0.02f) {
            Vec3 p = bspline_evaluatePosition(controlPoints, seg, t);
            glVertex3f(p.x, p.y, p.z);
        }
        glEnd();
    }
}

void drawControlPoints(const Vec3* controlPoints, int numPoints, float size, const float* color) {
    if (!controlPoints || numPoints <= 0) return;
    
    // Default color: black
    if (color) {
        glColor3fv(color);
    } else {
        glColor3f(0.0f, 0.0f, 0.0f);
    }
    
    glPointSize(size);
    glBegin(GL_POINTS);
    for (int i = 0; i < numPoints; i++) {
        glVertex3f(controlPoints[i].x, controlPoints[i].y, controlPoints[i].z);
    }
    glEnd();
}

void drawControlPolygon(const Vec3* controlPoints, int numPoints, const float* color) {
    if (!controlPoints || numPoints <= 0) return;
    
    // Default color: light gray
    if (color) {
        glColor3fv(color);
    } else {
        glColor3f(0.7f, 0.7f, 0.7f);
    }
    
    glLineWidth(1.0f);
    glBegin(GL_LINE_STRIP);
    for (int i = 0; i < numPoints; i++) {
        glVertex3f(controlPoints[i].x, controlPoints[i].y, controlPoints[i].z);
    }
    glEnd();
}

void drawTangentVector(Vec3 position, Vec3 tangent, float scale, const float* color) {
    // Normalize tangent
    Vec3 normalized = bspline_normalize(tangent);
    
    // Default color: yellow
    if (color) {
        glColor3fv(color);
    } else {
        glColor3f(1.0f, 1.0f, 0.0f);
    }
    
    glLineWidth(2.0f);
    glBegin(GL_LINES);
        // Start at curve point
        glVertex3f(position.x, position.y, position.z);
        // End at curve point + scaled tangent
        glVertex3f(position.x + normalized.x * scale,
                   position.y + normalized.y * scale,
                   position.z + normalized.z * scale);
    glEnd();
    
    // Draw arrowhead at the end (optional, for better visualization)
    Vec3 end = {
        position.x + normalized.x * scale,
        position.y + normalized.y * scale,
        position.z + normalized.z * scale
    };
    
    glPointSize(6.0f);
    glBegin(GL_POINTS);
        glVertex3f(end.x, end.y, end.z);
    glEnd();
}

void drawTangentsAlongSegment(const Vec3* controlPoints, int segment, int numSamples, float scale) {
    if (!controlPoints || numSamples <= 0) return;
    
    for (int i = 0; i <= numSamples; i++) {
        float t = (float)i / (float)numSamples;
        Vec3 pos = bspline_evaluatePosition(controlPoints, segment, t);
        Vec3 tan = bspline_evaluateTangent(controlPoints, segment, t);
        drawTangentVector(pos, tan, scale, NULL);  // Default yellow
    }
}

void drawFrenetFrame(Vec3 position, FrenetFrame frame, float scale) {
    glLineWidth(3.0f);
    
    // Tangent (red) - forward/motion direction
    glColor3f(1.0f, 0.0f, 0.0f);
    glBegin(GL_LINES);
        glVertex3f(position.x, position.y, position.z);
        glVertex3f(position.x + frame.tangent.x * scale,
                   position.y + frame.tangent.y * scale,
                   position.z + frame.tangent.z * scale);
    glEnd();
    
    // Normal (green) - toward center of curvature
    glColor3f(0.0f, 1.0f, 0.0f);
    glBegin(GL_LINES);
        glVertex3f(position.x, position.y, position.z);
        glVertex3f(position.x + frame.normal.x * scale,
                   position.y + frame.normal.y * scale,
                   position.z + frame.normal.z * scale);
    glEnd();
    
    // Binormal (blue) - perpendicular to both
    glColor3f(0.0f, 0.0f, 1.0f);
    glBegin(GL_LINES);
        glVertex3f(position.x, position.y, position.z);
        glVertex3f(position.x + frame.binormal.x * scale,
                   position.y + frame.binormal.y * scale,
                   position.z + frame.binormal.z * scale);
    glEnd();
}

void drawAxes(float size) {
    glLineWidth(2.0f);
    
    // X axis - Red
    glColor3f(1.0f, 0.0f, 0.0f);
    glBegin(GL_LINES);
        glVertex3f(0.0f, 0.0f, 0.0f);
        glVertex3f(size, 0.0f, 0.0f);
    glEnd();
    
    // Y axis - Green
    glColor3f(0.0f, 1.0f, 0.0f);
    glBegin(GL_LINES);
        glVertex3f(0.0f, 0.0f, 0.0f);
        glVertex3f(0.0f, size, 0.0f);
    glEnd();
    
    // Z axis - Blue
    glColor3f(0.0f, 0.0f, 1.0f);
    glBegin(GL_LINES);
        glVertex3f(0.0f, 0.0f, 0.0f);
        glVertex3f(0.0f, 0.0f, size);
    glEnd();
}

void drawGrid(float size, float spacing, const float* color) {
    // Default color: light gray
    if (color) {
        glColor3fv(color);
    } else {
        glColor3f(0.8f, 0.8f, 0.8f);
    }
    
    glLineWidth(1.0f);
    glBegin(GL_LINES);
    
    // Lines parallel to X axis
    for (float y = -size; y <= size; y += spacing) {
        glVertex3f(-size, y, 0.0f);
        glVertex3f( size, y, 0.0f);
    }
    
    // Lines parallel to Y axis
    for (float x = -size; x <= size; x += spacing) {
        glVertex3f(x, -size, 0.0f);
        glVertex3f(x,  size, 0.0f);
    }
    
    glEnd();
}
