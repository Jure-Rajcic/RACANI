#ifndef FILE_IO_H
#define FILE_IO_H

#include "bspline.h"

// ============================================================================
// CONTROL POINT GENERATION AND DISPLAY
// ============================================================================

/**
 * Creates the spiral B-spline path for animation (Assignment Task 4)
 * 
 * Generates 12 control points in a 3D spiral pattern as specified:
 * V1=(0,0,0)   V2=(0,10,5)   V3=(10,10,10)  V4=(10,0,15)
 * V5=(0,0,20)  V6=(0,10,25)  V7=(10,10,30)  V8=(10,0,35)
 * V9=(0,0,40)  V10=(0,10,45) V11=(10,10,50) V12=(10,0,55)
 * 
 * This creates a path that:
 * - Spirals upward along the Z axis
 * - Alternates between 4 corner positions in the XY plane
 * - Has 9 B-spline segments (segments = control_points - 3)
 * 
 * @param outCount Output: number of control points generated (always 12)
 * @return Dynamically allocated array of Vec3 control points (caller must free with free())
 */
Vec3* createSpiralPath(int* outCount);

/**
 * Prints control points to console for debugging
 * 
 * Displays all control points in a formatted table:
 * === Control Points (N) ===
 *   P0: (x, y, z)
 *   P1: (x, y, z)
 *   ...
 * 
 * @param points Array of control points to display
 * @param count Number of points in the array
 */
void printControlPoints(const Vec3* points, int count);

#endif // FILE_IO_H
