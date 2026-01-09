#ifndef BSPLINE_H
#define BSPLINE_H

// ============================================================================
// UNIFORM CUBIC B-SPLINE HEADER
// Equations: 1.2 (position), 1.3/1.4 (tangent), 1.3 (orientation)
// ============================================================================

// 3D vector structure
typedef struct {
    double x;
    double y;
    double z;
} Vec3;

// Euler angles for 3D orientation (section 1.3)
typedef struct {
    float roll;   // Rotation around X axis (nagib)
    float pitch;  // Rotation around Y axis (dubina)
    float yaw;    // Rotation around Z axis (smjer)
} EulerAngles;

// Axis-angle rotation representation (section 1.4)
typedef struct {
    Vec3 axis;    // Rotation axis (osₓ, osᵧ, osᵤ)
    float angle;  // Rotation angle φ in degrees
} AxisAngle;

// Frenet-Serret frame for DCM matrix orientation (section 1.6)
typedef struct {
    Vec3 tangent;   // w vector (forward/direction of motion)
    Vec3 normal;    // u vector (toward center of curvature)
    Vec3 binormal;  // v vector (perpendicular to both)
} FrenetFrame;

// ============================================================================
// CORE B-SPLINE FUNCTIONS
// ============================================================================

/**
 * Evaluate position on B-spline curve segment at parameter t
 * 
 * @param controlPoints Array of control points
 * @param segment Segment index (1 to n-3, where n is number of control points)
 * @param t Parameter in [0, 1)
 * @return Position vector on the curve
 */
Vec3 bspline_evaluatePosition(const Vec3* controlPoints, int segment, float t);

/**
 * Evaluate tangent (derivative) on segment at parameter t
 * 
 * Implements equation 1.3: p'_i(t) = [3t^2, 2t, 1, 0] * B_{i,3} * R_i
 * 
 * Returns direction vector (tangent) at the curve point.
 * 
 * @param controlPoints Array of control points
 * @param segment Segment index (1 to n-3)
 * @param t Parameter in [0, 1)
 * @return Tangent vector (unnormalized direction vector)
 */
Vec3 bspline_evaluateTangent(const Vec3* controlPoints, int segment, float t);

/**
 * Evaluate tangent using alternative formulation (equation 1.4)
 * 
 * Implements equation 1.4: p'_i(t) = [t^2, t, 1] * (1/2) * B'_{i,3} * R_i
 * 
 * Mathematically equivalent to bspline_evaluateTangent (equation 1.3).
 * 
 * @param controlPoints Array of control points
 * @param segment Segment index (1 to n-3)
 * @param t Parameter in [0, 1)
 * @return Tangent vector (same as bspline_evaluateTangent)
 */
Vec3 bspline_evaluateTangent_Alt(const Vec3* controlPoints, int segment, float t);

/**
 * Calculate number of segments for given number of control points
 * Formula: numSegments = n - 3
 * 
 * @param numControlPoints Number of control points
 * @return Number of curve segments
 */
int bspline_getNumSegments(int numControlPoints);

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Normalize a vector to unit length
 * 
 * @param v Input vector
 * @return Normalized vector
 */
Vec3 bspline_normalize(Vec3 v);

/**
 * Get 2D orientation angle from tangent vector
 * 
 * @param tangent Tangent vector
 * @return Angle in degrees (yaw for use with glRotatef)
 */
float bspline_getOrientationAngle(Vec3 tangent);

/**
 * Compute cross product of two vectors
 * 
 * @param a First vector
 * @param b Second vector
 * @return Cross product a × b
 */
Vec3 bspline_cross(Vec3 a, Vec3 b);

/**
 * Compute dot product of two vectors
 * 
 * @param a First vector
 * @param b Second vector
 * @return Dot product a · b
 */
double bspline_dot(Vec3 a, Vec3 b);

/**
 * Compute vector length (magnitude)
 * 
 * @param v Vector
 * @return Length |v|
 */
double bspline_length(Vec3 v);

// ============================================================================
// ORIENTATION FUNCTIONS (Section 1.3)
// ============================================================================

/**
 * Compute 3D orientation (Euler angles) from tangent vector
 * 
 * Implements section 1.3 - roll/pitch/yaw orientation.
 * Handles gimbal lock detection.
 * 
 * @param tangent Direction vector (from curve tangent)
 * @param worldUp Up vector in world space (typically [0, 1, 0])
 * @return Euler angles in degrees
 */
EulerAngles bspline_getEulerAngles(Vec3 tangent, Vec3 worldUp);

/**
 * Apply Euler angles orientation in OpenGL
 * 
 * Call this after glTranslatef to apply orientation.
 * Applies rotations in order: Roll → Pitch → Yaw
 * 
 * @param angles Euler angles in degrees
 */
void bspline_applyOrientation(EulerAngles angles);

// ============================================================================
// AXIS-ANGLE ROTATION (Section 1.4)
// ============================================================================

/**
 * Compute rotation axis and angle from start to end orientation
 * 
 * Implements equations 1.5 (cross product) and 1.6 (dot product).
 * This method provides the shortest rotation path from start to end.
 * 
 * Equation 1.5: axis = start × end (cross product)
 * Equation 1.6: cos(angle) = (start · end) / (|start| |end|)
 * 
 * @param start Initial orientation vector (e.g., {0, 0, 1} for object facing +Z)
 * @param end Target orientation vector (typically from tangent)
 * @return Axis-angle representation for glRotatef
 */
AxisAngle bspline_computeAxisAngle(Vec3 start, Vec3 end);

/**
 * Apply axis-angle rotation in OpenGL
 * 
 * Convenience function for applying AxisAngle rotation.
 * Equivalent to: glRotatef(aa.angle, aa.axis.x, aa.axis.y, aa.axis.z)
 * 
 * @param aa Axis-angle rotation
 */
void bspline_applyAxisAngle(AxisAngle aa);

// ============================================================================
// DCM MATRIX ORIENTATION (Section 1.6 - Frenet-Serret Frame)
// ============================================================================

/**
 * Evaluate second derivative (acceleration) on segment at parameter t
 * 
 * p''(t) = [6t, 2, 0, 0] · B_{i,3} · R_i
 * 
 * Used for computing normal vector in equation 1.7.
 * Returns vector pointing toward center of curvature.
 * 
 * @param controlPoints Array of control points
 * @param segment Segment index (1 to n-3)
 * @param t Parameter in [0, 1)
 * @return Second derivative vector (may be zero for straight segments)
 */
Vec3 bspline_evaluateSecondDerivative(const Vec3* controlPoints, int segment, float t);

/**
 * Compute Frenet-Serret coordinate frame from curve
 * 
 * Implements equations 1.7 and 1.8:
 * - Tangent (w): p'(t) - direction of motion
 * - Normal (u): p'(t) × p''(t) - equation 1.7
 * - Binormal (v): w × u - equation 1.8
 * 
 * Forms right-handed orthonormal coordinate system (w, u, v).
 * Handles degenerate case when p''(t) = 0 (colinear control points).
 * 
 * @param controlPoints Array of control points
 * @param segment Segment index (1 to n-3)
 * @param t Parameter in [0, 1)
 * @return Frenet-Serret frame with normalized tangent, normal, binormal
 */
FrenetFrame bspline_computeFrenetFrame(const Vec3* controlPoints, int segment, float t);

/**
 * Convert Frenet-Serret frame to OpenGL 4x4 matrix
 * 
 * Implements equation 1.9: R = [w  u  v]
 * 
 * For OpenGL, use useInverse=1 to get R^T (transpose) which transforms
 * from object's local space (x,y,z) to curve's space (w,u,v).
 * 
 * @param frame Frenet-Serret frame
 * @param matrix Output 4x4 matrix in OpenGL column-major format (16 floats)
 * @param useInverse If 1, compute R^T (for object→curve), if 0, compute R
 */
void bspline_frenetToMatrix(FrenetFrame frame, float matrix[16], int useInverse);

/**
 * Apply Frenet-Serret frame orientation in OpenGL
 * 
 * Applies DCM matrix (equation 1.9) to orient object along curve
 * using tangent, normal, and binormal vectors.
 * 
 * Call after glTranslatef to apply orientation.
 * 
 * @param frame Frenet-Serret frame
 */
void bspline_applyFrenetFrame(FrenetFrame frame);

// ============================================================================
// INTERNAL HELPER FUNCTIONS
// ============================================================================

/**
 * Compute coefficient array for position evaluation
 * (Internal helper - typically not needed by users)
 * 
 * @param t Parameter in [0, 1)
 * @param c Output array of 4 coefficients
 */
void bspline_computeCoefficients(float t, float c[4]);

/**
 * Compute coefficient array for tangent evaluation (equation 1.3)
 * (Internal helper - typically not needed by users)
 * 
 * @param t Parameter in [0, 1)
 * @param c Output array of 4 derivative coefficients
 */
void bspline_computeDerivativeCoefficients(float t, float c[4]);

/**
 * Compute coefficient array for tangent evaluation (equation 1.4)
 * Alternative formulation using B'_{i,3} basis matrix.
 * (Internal helper - typically not needed by users)
 * 
 * @param t Parameter in [0, 1)
 * @param c Output array of 4 derivative coefficients
 */
void bspline_computeDerivativeCoefficients_Alt(float t, float c[4]);

#endif // BSPLINE_H
