#include "file_io.h"
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

// ============================================================================
// CONTROL POINT GENERATION AND DISPLAY
// ============================================================================

Vec3* createSpiralPath(int* outCount) {
    // Assignment Task 4: 3D spiral path with 12 control points
    // Creates a helix that spirals upward with 4 corner positions in XY plane
    // Pattern: (0,0) -> (0,10) -> (10,10) -> (10,0) -> repeat, incrementing Z by 5 each step
    static Vec3 spiral[] = {
        { 0.0,  0.0,  0.0},  // V1
        { 0.0, 10.0,  5.0},  // V2
        {10.0, 10.0, 10.0},  // V3
        {10.0,  0.0, 15.0},  // V4
        { 0.0,  0.0, 20.0},  // V5
        { 0.0, 10.0, 25.0},  // V6
        {10.0, 10.0, 30.0},  // V7
        {10.0,  0.0, 35.0},  // V8
        { 0.0,  0.0, 40.0},  // V9
        { 0.0, 10.0, 45.0},  // V10
        {10.0, 10.0, 50.0},  // V11
        {10.0,  0.0, 55.0}   // V12
    };
    
    // Allocate memory and copy spiral data
    int count = 12;
    Vec3* points = (Vec3*)malloc(count * sizeof(Vec3));
    if (!points) {
        fprintf(stderr, "Error: Failed to allocate memory for spiral path\n");
        *outCount = 0;
        return NULL;
    }
    
    memcpy(points, spiral, count * sizeof(Vec3));
    *outCount = count;
    printf("Created spiral path with %d control points\n", count);
    
    return points;
}

void printControlPoints(const Vec3* points, int count) {
    // Display all control points in formatted table for debugging
    if (!points || count <= 0) {
        printf("No control points\n");
        return;
    }
    
    printf("=== Control Points (%d) ===\n", count);
    for (int i = 0; i < count; i++) {
        printf("  P%d: (%.2f, %.2f, %.2f)\n", i, points[i].x, points[i].y, points[i].z);
    }
    printf("===========================\n");
}
