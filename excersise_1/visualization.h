#ifndef VISUALIZATION_H
#define VISUALIZATION_H

#include "bspline.h"

// ============================================================================
// VISUALIZATION HELPER FUNCTIONS
// For drawing B-spline curves, tangents, control points, etc.
// ============================================================================

/**
 * Draw B-spline curve
 * 
 * Draws the entire curve by sampling each segment.
 * 
 * @param controlPoints Array of control points
 * @param numSegments Number of segments (n-3)
 * @param color RGB color (NULL for default gray)
 */
void drawBSplineCurve(const Vec3* controlPoints, int numSegments, const float* color);

/**
 * Draw control points as dots
 * 
 * @param controlPoints Array of control points
 * @param numPoints Number of control points
 * @param size Point size in pixels
 * @param color RGB color (NULL for default black)
 */
void drawControlPoints(const Vec3* controlPoints, int numPoints, float size, const float* color);

/**
 * Draw control polygon (lines connecting control points)
 * 
 * @param controlPoints Array of control points
 * @param numPoints Number of control points
 * @param color RGB color (NULL for default gray)
 */
void drawControlPolygon(const Vec3* controlPoints, int numPoints, const float* color);

/**
 * Draw tangent vector at a point (Task 3.3)
 * 
 * Draws a line from the curve point in the direction of the tangent.
 * Implements: "kratka dužina u smjeru tangente"
 * 
 * @param position Point on curve (starting point)
 * @param tangent Tangent vector (direction)
 * @param scale Scaling factor for tangent length
 * @param color RGB color (NULL for default yellow)
 */
void drawTangentVector(Vec3 position, Vec3 tangent, float scale, const float* color);

/**
 * Draw multiple tangent vectors along curve
 * 
 * @param controlPoints Array of control points
 * @param segment Segment index
 * @param numSamples Number of tangents to draw along segment
 * @param scale Tangent length scale
 */
void drawTangentsAlongSegment(const Vec3* controlPoints, int segment, int numSamples, float scale);

/**
 * Draw Frenet-Serret frame at a point (for debugging DCM method)
 * 
 * Draws tangent (red), normal (green), binormal (blue).
 * 
 * @param position Point on curve
 * @param frame Frenet-Serret frame
 * @param scale Vector length scale
 */
void drawFrenetFrame(Vec3 position, FrenetFrame frame, float scale);

/**
 * Draw coordinate axes at origin
 * 
 * X=red, Y=green, Z=blue
 * 
 * @param size Axis length
 */
void drawAxes(float size);

/**
 * Draw grid on XY plane
 * 
 * @param size Grid size (half-width)
 * @param spacing Grid line spacing
 * @param color RGB color (NULL for default light gray)
 */
void drawGrid(float size, float spacing, const float* color);

#endif // VISUALIZATION_H
