#ifndef OBJ_LOADER_H
#define OBJ_LOADER_H

#include "bspline.h"

// ============================================================================
// SIMPLE WAVEFRONT OBJ LOADER
// Supports only vertex positions (v) and faces (f) - sufficient for assignment
// ============================================================================

/**
 * OBJ Model structure
 * 
 * Stores original vertex positions and polygon indices.
 * Follows section 1.5 principle: keep original coordinates unchanged.
 */
typedef struct {
    Vec3* vertices;        // Array of vertex positions (original coordinates)
    int numVertices;       // Number of vertices
    
    int* indices;          // Array of vertex indices for triangles
    int numIndices;        // Number of indices (numTriangles * 3)
    
    Vec3 center;           // Model center (for centering)
    float scale;           // Suggested scale factor
} OBJModel;

// ============================================================================
// LOADING FUNCTIONS
// ============================================================================

/**
 * Load OBJ model from file
 * 
 * Parses simplified Wavefront OBJ format:
 * - v x y z          (vertex positions)
 * - f i1 i2 i3       (triangular faces, 1-indexed)
 * - f i1/t1 i2/t2... (ignores texture/normal indices)
 * 
 * @param filename Path to .obj file
 * @return Pointer to loaded model, or NULL on error
 */
OBJModel* loadOBJ(const char* filename);

/**
 * Free OBJ model memory
 * 
 * @param model Model to free
 */
void freeOBJModel(OBJModel* model);

/**
 * Print OBJ model statistics
 * 
 * @param model Model to print info about
 */
void printOBJInfo(const OBJModel* model);

// ============================================================================
// RENDERING FUNCTIONS
// ============================================================================

/**
 * Draw OBJ model using current OpenGL transformation
 * 
 * Uses original vertex coordinates (section 1.5).
 * Applies current GL_MODELVIEW matrix for transformation.
 * 
 * @param model Model to draw
 */
void drawOBJModel(const OBJModel* model);

/**
 * Draw OBJ model wireframe
 * 
 * @param model Model to draw
 */
void drawOBJModelWireframe(const OBJModel* model);

/**
 * Draw OBJ model with normals (for debugging)
 * 
 * @param model Model to draw
 * @param normalLength Length of normal vectors to display
 */
void drawOBJModelWithNormals(const OBJModel* model, float normalLength);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Compute model bounding box center
 * 
 * @param model Model to analyze
 * @return Center point of bounding box
 */
Vec3 getModelCenter(const OBJModel* model);

/**
 * Compute model bounding box size
 * 
 * @param model Model to analyze
 * @return Maximum dimension of bounding box
 */
float getModelSize(const OBJModel* model);

/**
 * Center and scale model to fit in unit cube
 * 
 * Modifies vertex coordinates to fit model in [-1, 1]³.
 * 
 * @param model Model to normalize
 */
void normalizeModel(OBJModel* model);

#endif // OBJ_LOADER_H
