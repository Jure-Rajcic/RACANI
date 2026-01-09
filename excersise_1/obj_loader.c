#include "obj_loader.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

#ifdef __APPLE__
    #include <GLUT/glut.h>
#else
    #include <GL/glut.h>
#endif

// ============================================================================
// LOADING FUNCTIONS
// ============================================================================

OBJModel* loadOBJ(const char* filename) {
    FILE* file = fopen(filename, "r");
    if (!file) {
        fprintf(stderr, "Error: Cannot open OBJ file '%s'\n", filename);
        return NULL;
    }
    
    printf("Loading OBJ file: %s\n", filename);
    
    // Allocate model
    OBJModel* model = (OBJModel*)malloc(sizeof(OBJModel));
    if (!model) {
        fclose(file);
        return NULL;
    }
    
    // Initial capacity for dynamic arrays
    int vertexCapacity = 1000;
    int indexCapacity = 3000;
    
    model->vertices = (Vec3*)malloc(vertexCapacity * sizeof(Vec3));
    model->indices = (int*)malloc(indexCapacity * sizeof(int));
    model->numVertices = 0;
    model->numIndices = 0;
    
    // Parse file line by line
    char line[256];
    int lineNum = 0;
    
    while (fgets(line, sizeof(line), file)) {
        lineNum++;
        
        // Skip empty lines and comments
        if (line[0] == '#' || line[0] == '\n' || line[0] == '\r') {
            continue;
        }
        
        // Parse vertex: v x y z
        if (line[0] == 'v' && line[1] == ' ') {
            // Expand array if needed
            if (model->numVertices >= vertexCapacity) {
                vertexCapacity *= 2;
                model->vertices = (Vec3*)realloc(model->vertices, vertexCapacity * sizeof(Vec3));
            }
            
            Vec3 v;
            if (sscanf(line, "v %lf %lf %lf", &v.x, &v.y, &v.z) == 3) {
                model->vertices[model->numVertices++] = v;
            } else {
                fprintf(stderr, "Warning: Malformed vertex on line %d\n", lineNum);
            }
        }
        
        // Parse face: f i1 i2 i3 or f i1/t1/n1 i2/t2/n2 i3/t3/n3
        else if (line[0] == 'f' && line[1] == ' ') {
            int v1, v2, v3;
            int t1, t2, t3, n1, n2, n3;  // Texture and normal indices (ignored)
            
            // Try different face formats
            int matched = 0;
            
            // Format: f v1 v2 v3
            if (sscanf(line, "f %d %d %d", &v1, &v2, &v3) == 3) {
                matched = 1;
            }
            // Format: f v1/t1 v2/t2 v3/t3
            else if (sscanf(line, "f %d/%d %d/%d %d/%d", &v1, &t1, &v2, &t2, &v3, &t3) == 6) {
                matched = 1;
            }
            // Format: f v1//n1 v2//n2 v3//n3
            else if (sscanf(line, "f %d//%d %d//%d %d//%d", &v1, &n1, &v2, &n2, &v3, &n3) == 6) {
                matched = 1;
            }
            // Format: f v1/t1/n1 v2/t2/n2 v3/t3/n3
            else if (sscanf(line, "f %d/%d/%d %d/%d/%d %d/%d/%d", 
                           &v1, &t1, &n1, &v2, &t2, &n2, &v3, &t3, &n3) == 9) {
                matched = 1;
            }
            
            if (matched) {
                // Expand array if needed
                if (model->numIndices + 3 >= indexCapacity) {
                    indexCapacity *= 2;
                    model->indices = (int*)realloc(model->indices, indexCapacity * sizeof(int));
                }
                
                // OBJ indices are 1-based, convert to 0-based
                model->indices[model->numIndices++] = v1 - 1;
                model->indices[model->numIndices++] = v2 - 1;
                model->indices[model->numIndices++] = v3 - 1;
            } else {
                fprintf(stderr, "Warning: Unsupported face format on line %d: %s", lineNum, line);
            }
        }
    }
    
    fclose(file);
    
    // Shrink arrays to actual size
    model->vertices = (Vec3*)realloc(model->vertices, model->numVertices * sizeof(Vec3));
    model->indices = (int*)realloc(model->indices, model->numIndices * sizeof(int));
    
    // Compute model center and size
    model->center = getModelCenter(model);
    model->scale = getModelSize(model);
    
    printf("Loaded: %d vertices, %d triangles\n", 
           model->numVertices, model->numIndices / 3);
    
    return model;
}

void freeOBJModel(OBJModel* model) {
    if (model) {
        if (model->vertices) free(model->vertices);
        if (model->indices) free(model->indices);
        free(model);
    }
}

void printOBJInfo(const OBJModel* model) {
    if (!model) {
        printf("Model: NULL\n");
        return;
    }
    
    printf("=== OBJ Model Info ===\n");
    printf("Vertices:  %d\n", model->numVertices);
    printf("Triangles: %d\n", model->numIndices / 3);
    printf("Center:    (%.2f, %.2f, %.2f)\n", model->center.x, model->center.y, model->center.z);
    printf("Size:      %.2f\n", model->scale);
    printf("======================\n");
}

// ============================================================================
// RENDERING FUNCTIONS
// ============================================================================

void drawOBJModel(const OBJModel* model) {
    if (!model || !model->vertices || !model->indices) {
        return;
    }
    
    // Draw triangles using original vertex coordinates (section 1.5!)
    glBegin(GL_TRIANGLES);
    for (int i = 0; i < model->numIndices; i += 3) {
        int i1 = model->indices[i];
        int i2 = model->indices[i + 1];
        int i3 = model->indices[i + 2];
        
        // Validate indices
        if (i1 < 0 || i1 >= model->numVertices ||
            i2 < 0 || i2 >= model->numVertices ||
            i3 < 0 || i3 >= model->numVertices) {
            fprintf(stderr, "Warning: Invalid triangle indices: %d %d %d\n", i1, i2, i3);
            continue;
        }
        
        Vec3 v1 = model->vertices[i1];
        Vec3 v2 = model->vertices[i2];
        Vec3 v3 = model->vertices[i3];
        
        // Compute face normal for shading
        Vec3 edge1 = {v2.x - v1.x, v2.y - v1.y, v2.z - v1.z};
        Vec3 edge2 = {v3.x - v1.x, v3.y - v1.y, v3.z - v1.z};
        Vec3 normal = bspline_cross(edge1, edge2);
        normal = bspline_normalize(normal);
        
        glNormal3f(normal.x, normal.y, normal.z);
        glVertex3f(v1.x, v1.y, v1.z);
        glVertex3f(v2.x, v2.y, v2.z);
        glVertex3f(v3.x, v3.y, v3.z);
    }
    glEnd();
}

void drawOBJModelWireframe(const OBJModel* model) {
    if (!model || !model->vertices || !model->indices) {
        return;
    }
    
    glPolygonMode(GL_FRONT_AND_BACK, GL_LINE);
    drawOBJModel(model);
    glPolygonMode(GL_FRONT_AND_BACK, GL_FILL);
}

void drawOBJModelWithNormals(const OBJModel* model, float normalLength) {
    if (!model || !model->vertices || !model->indices) {
        return;
    }
    
    // Draw model
    drawOBJModel(model);
    
    // Draw normals as lines
    glColor3f(0.0f, 1.0f, 1.0f);  // Cyan
    glBegin(GL_LINES);
    for (int i = 0; i < model->numIndices; i += 3) {
        int i1 = model->indices[i];
        int i2 = model->indices[i + 1];
        int i3 = model->indices[i + 2];
        
        if (i1 < 0 || i1 >= model->numVertices ||
            i2 < 0 || i2 >= model->numVertices ||
            i3 < 0 || i3 >= model->numVertices) {
            continue;
        }
        
        Vec3 v1 = model->vertices[i1];
        Vec3 v2 = model->vertices[i2];
        Vec3 v3 = model->vertices[i3];
        
        // Compute face center
        Vec3 center = {
            (v1.x + v2.x + v3.x) / 3.0,
            (v1.y + v2.y + v3.y) / 3.0,
            (v1.z + v2.z + v3.z) / 3.0
        };
        
        // Compute normal
        Vec3 edge1 = {v2.x - v1.x, v2.y - v1.y, v2.z - v1.z};
        Vec3 edge2 = {v3.x - v1.x, v3.y - v1.y, v3.z - v1.z};
        Vec3 normal = bspline_cross(edge1, edge2);
        normal = bspline_normalize(normal);
        
        // Draw normal line
        glVertex3f(center.x, center.y, center.z);
        glVertex3f(center.x + normal.x * normalLength,
                   center.y + normal.y * normalLength,
                   center.z + normal.z * normalLength);
    }
    glEnd();
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

Vec3 getModelCenter(const OBJModel* model) {
    if (!model || model->numVertices == 0) {
        return (Vec3){0.0, 0.0, 0.0};
    }
    
    Vec3 min = model->vertices[0];
    Vec3 max = model->vertices[0];
    
    for (int i = 1; i < model->numVertices; i++) {
        Vec3 v = model->vertices[i];
        if (v.x < min.x) min.x = v.x;
        if (v.y < min.y) min.y = v.y;
        if (v.z < min.z) min.z = v.z;
        if (v.x > max.x) max.x = v.x;
        if (v.y > max.y) max.y = v.y;
        if (v.z > max.z) max.z = v.z;
    }
    
    return (Vec3){
        (min.x + max.x) / 2.0,
        (min.y + max.y) / 2.0,
        (min.z + max.z) / 2.0
    };
}

float getModelSize(const OBJModel* model) {
    if (!model || model->numVertices == 0) {
        return 1.0f;
    }
    
    Vec3 min = model->vertices[0];
    Vec3 max = model->vertices[0];
    
    for (int i = 1; i < model->numVertices; i++) {
        Vec3 v = model->vertices[i];
        if (v.x < min.x) min.x = v.x;
        if (v.y < min.y) min.y = v.y;
        if (v.z < min.z) min.z = v.z;
        if (v.x > max.x) max.x = v.x;
        if (v.y > max.y) max.y = v.y;
        if (v.z > max.z) max.z = v.z;
    }
    
    float dx = max.x - min.x;
    float dy = max.y - min.y;
    float dz = max.z - min.z;
    
    // Return maximum dimension
    float maxDim = dx;
    if (dy > maxDim) maxDim = dy;
    if (dz > maxDim) maxDim = dz;
    
    return maxDim;
}

void normalizeModel(OBJModel* model) {
    if (!model || model->numVertices == 0) {
        return;
    }
    
    Vec3 center = getModelCenter(model);
    float size = getModelSize(model);
    
    if (size < 1e-6) {
        return;  // Avoid division by zero
    }
    
    // Scale factor to fit in [-1, 1] cube
    float scale = 2.0f / size;
    
    printf("Normalizing model: center=(%.2f, %.2f, %.2f), size=%.2f, scale=%.3f\n",
           center.x, center.y, center.z, size, scale);
    
    // Transform all vertices
    for (int i = 0; i < model->numVertices; i++) {
        // Center and scale
        model->vertices[i].x = (model->vertices[i].x - center.x) * scale;
        model->vertices[i].y = (model->vertices[i].y - center.y) * scale;
        model->vertices[i].z = (model->vertices[i].z - center.z) * scale;
    }
    
    // Update model info
    model->center = (Vec3){0.0, 0.0, 0.0};
    model->scale = 2.0f;
}
