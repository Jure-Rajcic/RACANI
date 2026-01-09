#include "bspline.h"
#include <stdio.h>
#include <stdlib.h>
#include <math.h>

// OpenGL header for orientation functions (optional - only needed if using bspline_applyOrientation)
#ifdef __APPLE__
    #include <GLUT/glut.h>
#else
    #include <GL/glut.h>
#endif

// ============================================================================
// UNIFORM CUBIC B-SPLINE IMPLEMENTATION
// Based on equations 1.2, 1.3, and 1.4 from the assignment
// ============================================================================

// Basis matrix B for uniform cubic B-spline (equation 1.2)
// B_{i,3} = (1/6) * [[-1, 3, -3, 1], [3, -6, 3, 0], [-3, 0, 3, 0], [1, 4, 1, 0]]
static const float B_SPLINE_BASIS[4][4] = {
    {-1.0f,  3.0f, -3.0f, 1.0f},
    { 3.0f, -6.0f,  3.0f, 0.0f},
    {-3.0f,  0.0f,  3.0f, 0.0f},
    { 1.0f,  4.0f,  1.0f, 0.0f}
};

// Derivative basis matrix B' for tangent calculation (equation 1.4)
// B'_{i,3} = (1/2) * [[-1, 3, -3, 1], [2, -4, 2, 0], [-1, 0, 1, 0]]
// Used with T_2 = [t^2, t, 1] (3x3 formulation)
static const float B_SPLINE_DERIVATIVE_BASIS[3][4] = {
    {-1.0f,  3.0f, -3.0f, 1.0f},
    { 2.0f, -4.0f,  2.0f, 0.0f},
    {-1.0f,  0.0f,  1.0f, 0.0f}
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Compute coefficients c = (1/6) * T * B
 * where T = [t^3, t^2, t, 1] (power basis)
 * 
 * @param t Parameter in [0, 1)
 * @param c Output array of 4 coefficients
 */
void bspline_computeCoefficients(float t, float c[4]) {
    float T[4] = {t * t * t, t * t, t, 1.0f};
    
    for (int j = 0; j < 4; j++) {
        c[j] = 0.0f;
        for (int i = 0; i < 4; i++) {
            c[j] += T[i] * B_SPLINE_BASIS[i][j];
        }
        c[j] /= 6.0f;  // Factor of 1/6 from equation 1.2
    }
}

/**
 * Compute derivative coefficients using equation 1.3
 * c' = (1/6) * T' * B_{i,3}
 * where T' = [3t^2, 2t, 1, 0] (derivative of power basis)
 * 
 * This implements equation 1.3 from the assignment:
 * p'_i(t) = [3t^2, 2t, 1, 0] * B_{i,3} * R_i
 * 
 * Used for computing tangent vectors for object orientation.
 * 
 * @param t Parameter in [0, 1)
 * @param c Output array of 4 derivative coefficients
 */
void bspline_computeDerivativeCoefficients(float t, float c[4]) {
    float Tprime[4] = {3.0f * t * t, 2.0f * t, 1.0f, 0.0f};
    
    for (int j = 0; j < 4; j++) {
        c[j] = 0.0f;
        for (int i = 0; i < 4; i++) {
            c[j] += Tprime[i] * B_SPLINE_BASIS[i][j];
        }
        c[j] /= 6.0f;
    }
}

/**
 * Compute derivative coefficients using equation 1.4 (alternative formulation)
 * c' = (1/2) * T_2 * B'_{i,3}
 * where T_2 = [t^2, t, 1] (reduced power basis)
 * 
 * This implements equation 1.4 from the assignment:
 * p'_i(t) = [t^2, t, 1] * (1/2) * B'_{i,3} * R_i
 * 
 * Both methods (equation 1.3 and 1.4) produce the same tangent vector.
 * 
 * @param t Parameter in [0, 1)
 * @param c Output array of 4 derivative coefficients
 */
void bspline_computeDerivativeCoefficients_Alt(float t, float c[4]) {
    float T2[3] = {t * t, t, 1.0f};
    
    for (int j = 0; j < 4; j++) {
        c[j] = 0.0f;
        for (int i = 0; i < 3; i++) {
            c[j] += T2[i] * B_SPLINE_DERIVATIVE_BASIS[i][j];
        }
        c[j] /= 2.0f;  // Factor of 1/2 from equation 1.4
    }
}

// ============================================================================
// MAIN B-SPLINE EVALUATION FUNCTIONS
// ============================================================================

/**
 * Evaluate position on B-spline curve segment i at parameter t
 * 
 * Implements equation 1.2:
 * p_i(t) = T_3 * B_{i,3} * R_i
 * 
 * Segment i uses control points: r[i-1], r[i], r[i+1], r[i+2]
 * - For n control points, we have n-3 segments
 * - Segment indexing: segment 1 uses r[0], r[1], r[2], r[3]
 * 
 * @param controlPoints Array of all control points
 * @param segment Segment index (1 to n-3)
 * @param t Parameter in [0, 1)
 * @return Position vector on the curve
 */
Vec3 bspline_evaluatePosition(const Vec3* controlPoints, int segment, float t) {
    float c[4];
    bspline_computeCoefficients(t, c);
    
    Vec3 pos = {0.0, 0.0, 0.0};
    
    // R_i = [r_{i-1}, r_i, r_{i+1}, r_{i+2}]^T
    // We blend 4 consecutive control points
    for (int k = 0; k < 4; k++) {
        int idx = segment - 1 + k;  // Convert segment index to array index
        pos.x += c[k] * controlPoints[idx].x;
        pos.y += c[k] * controlPoints[idx].y;
        pos.z += c[k] * controlPoints[idx].z;
    }
    
    return pos;
}

/**
 * Evaluate tangent (first derivative) on segment i at parameter t
 * 
 * Implements equation 1.3:
 * ∂p_i(t)/∂t = p'_i(t) = [3t^2, 2t, 1, 0] * B_{i,3} * R_i
 * 
 * The tangent vector p'_i(t) indicates the DIRECTION of motion along the curve.
 * Note: equation 1.2 gives a POINT on the curve p_i(t),
 *       equation 1.3/1.4 gives a VECTOR (tangent) at that point.
 * 
 * Use atan2(tangent.y, tangent.x) to compute orientation angle in 2D.
 * 
 * @param controlPoints Array of all control points
 * @param segment Segment index (1 to n-3)
 * @param t Parameter in [0, 1)
 * @return Tangent vector (unnormalized direction vector)
 */
Vec3 bspline_evaluateTangent(const Vec3* controlPoints, int segment, float t) {
    float c[4];
    bspline_computeDerivativeCoefficients(t, c);  // Uses equation 1.3
    
    Vec3 tangent = {0.0, 0.0, 0.0};
    
    // R_i = [r_{i-1}, r_i, r_{i+1}, r_{i+2}]^T
    for (int k = 0; k < 4; k++) {
        int idx = segment - 1 + k;
        tangent.x += c[k] * controlPoints[idx].x;
        tangent.y += c[k] * controlPoints[idx].y;
        tangent.z += c[k] * controlPoints[idx].z;
    }
    
    return tangent;
}

/**
 * Evaluate tangent using alternative formulation (equation 1.4)
 * 
 * Implements equation 1.4:
 * p'_i(t) = [t^2, t, 1] * (1/2) * B'_{i,3} * R_i
 * 
 * This is mathematically equivalent to equation 1.3 but uses a different
 * basis matrix B'_{i,3} (3x4) with reduced power basis T_2 = [t^2, t, 1].
 * 
 * @param controlPoints Array of all control points
 * @param segment Segment index (1 to n-3)
 * @param t Parameter in [0, 1)
 * @return Tangent vector (same result as bspline_evaluateTangent)
 */
Vec3 bspline_evaluateTangent_Alt(const Vec3* controlPoints, int segment, float t) {
    float c[4];
    bspline_computeDerivativeCoefficients_Alt(t, c);  // Uses equation 1.4
    
    Vec3 tangent = {0.0, 0.0, 0.0};
    
    for (int k = 0; k < 4; k++) {
        int idx = segment - 1 + k;
        tangent.x += c[k] * controlPoints[idx].x;
        tangent.y += c[k] * controlPoints[idx].y;
        tangent.z += c[k] * controlPoints[idx].z;
    }
    
    return tangent;
}

/**
 * Calculate the number of segments for n control points
 * 
 * @param numControlPoints Number of control points
 * @return Number of segments (n - 3)
 */
int bspline_getNumSegments(int numControlPoints) {
    return numControlPoints - 3;
}

/**
 * Normalize a vector (make it unit length)
 * 
 * @param v Input vector
 * @return Normalized vector
 */
Vec3 bspline_normalize(Vec3 v) {
    double len = sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    if (len < 1e-9) {
        return (Vec3){0.0, 0.0, 0.0};
    }
    return (Vec3){v.x / len, v.y / len, v.z / len};
}

/**
 * Get orientation angle from tangent vector (2D)
 * 
 * Returns yaw angle for 2D orientation (rotation around Z axis).
 * 
 * @param tangent Tangent vector
 * @return Angle in degrees (yaw)
 */
float bspline_getOrientationAngle(Vec3 tangent) {
    return atan2f(tangent.y, tangent.x) * 180.0f / M_PI;
}

// ============================================================================
// ORIENTATION HELPER FUNCTIONS (Section 1.3)
// ============================================================================

/**
 * Compute cross product of two vectors
 * 
 * @param a First vector
 * @param b Second vector
 * @return Cross product a × b
 */
Vec3 bspline_cross(Vec3 a, Vec3 b) {
    Vec3 result;
    result.x = a.y * b.z - a.z * b.y;
    result.y = a.z * b.x - a.x * b.z;
    result.z = a.x * b.y - a.y * b.x;
    return result;
}

/**
 * Compute dot product of two vectors
 * 
 * @param a First vector
 * @param b Second vector
 * @return Dot product a · b
 */
double bspline_dot(Vec3 a, Vec3 b) {
    return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Compute vector length (magnitude)
 * 
 * @param v Vector
 * @return Length |v|
 */
double bspline_length(Vec3 v) {
    return sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

/**
 * Compute 3D orientation (Euler angles) from tangent vector
 * 
 * Implements section 1.3 - Object orientation using roll/pitch/yaw.
 * 
 * @param tangent Direction vector (from curve tangent)
 * @param worldUp Up vector in world space (typically [0, 1, 0])
 * @return Euler angles in degrees
 */
EulerAngles bspline_getEulerAngles(Vec3 tangent, Vec3 worldUp) {
    EulerAngles angles;
    
    // Normalize forward direction
    Vec3 forward = bspline_normalize(tangent);
    
    // Compute right vector (perpendicular to forward and up)
    Vec3 right = bspline_cross(forward, worldUp);
    right = bspline_normalize(right);
    
    // Recompute up vector to ensure orthogonality
    Vec3 up = bspline_cross(right, forward);
    
    // Build rotation matrix:
    // [right.x   up.x   -forward.x]
    // [right.y   up.y   -forward.y]
    // [right.z   up.z   -forward.z]
    
    // Extract Euler angles (YXZ order: yaw, pitch, roll)
    angles.pitch = asinf(-forward.z);
    
    // Check for gimbal lock
    if (fabsf(cosf(angles.pitch)) > 0.001f) {
        angles.yaw = atan2f(forward.x, forward.y);
        angles.roll = atan2f(right.z, up.z);
    } else {
        // Gimbal lock case (pitch = ±90°)
        angles.yaw = atan2f(-right.y, right.x);
        angles.roll = 0.0f;
    }
    
    // Convert to degrees
    angles.roll *= 180.0f / M_PI;
    angles.pitch *= 180.0f / M_PI;
    angles.yaw *= 180.0f / M_PI;
    
    return angles;
}

/**
 * Apply Euler angles orientation in OpenGL
 * 
 * Call this after glTranslatef to apply orientation.
 * Order: Yaw → Pitch → Roll
 * 
 * @param angles Euler angles in degrees
 */
void bspline_applyOrientation(EulerAngles angles) {
    // OpenGL rotations are applied in reverse order
    // We want: Yaw → Pitch → Roll
    // So we write: Roll → Pitch → Yaw
    glRotatef(angles.roll, 1.0f, 0.0f, 0.0f);   // Roll around X
    glRotatef(angles.pitch, 0.0f, 1.0f, 0.0f);  // Pitch around Y
    glRotatef(angles.yaw, 0.0f, 0.0f, 1.0f);    // Yaw around Z
}

// ============================================================================
// AXIS-ANGLE ROTATION (Section 1.4)
// ============================================================================

/**
 * Compute rotation axis and angle from start to end orientation
 * 
 * Implements equations 1.5 and 1.6 from section 1.4:
 * - Equation 1.5: axis = start × end (cross product determines rotation axis)
 * - Equation 1.6: cos(φ) = (start · end) / (|start| |end|) (dot product for angle)
 * 
 * This method provides the shortest rotation path from start to end orientation.
 * 
 * @param start Initial orientation vector (e.g., {0, 0, 1} for nose along +Z)
 * @param end Target orientation vector (typically normalized tangent from curve)
 * @return Axis-angle representation ready for glRotatef
 */
AxisAngle bspline_computeAxisAngle(Vec3 start, Vec3 end) {
    AxisAngle result;
    
    // Normalize both vectors to ensure correct angle calculation
    Vec3 s = bspline_normalize(start);
    Vec3 e = bspline_normalize(end);
    
    // Equation 1.5: os = s × e (cross product)
    // Determines the rotation axis perpendicular to both vectors
    result.axis = bspline_cross(s, e);
    
    // Check for parallel or anti-parallel vectors
    double axisLength = bspline_length(result.axis);
    
    if (axisLength < 1e-6) {
        // Vectors are parallel (same or opposite direction)
        double dot = bspline_dot(s, e);
        
        if (dot > 0.0) {
            // Same direction - no rotation needed
            result.axis = (Vec3){0.0, 1.0, 0.0};  // Arbitrary axis
            result.angle = 0.0f;
        } else {
            // Opposite directions - 180° rotation
            // Choose axis perpendicular to start vector
            if (fabs(s.x) < 0.9) {
                // Use X axis to compute perpendicular
                result.axis = bspline_normalize(bspline_cross(s, (Vec3){1.0, 0.0, 0.0}));
            } else {
                // Use Y axis to compute perpendicular
                result.axis = bspline_normalize(bspline_cross(s, (Vec3){0.0, 1.0, 0.0}));
            }
            result.angle = 180.0f;
        }
        
        return result;
    }
    
    // Normalize the rotation axis
    result.axis.x /= axisLength;
    result.axis.y /= axisLength;
    result.axis.z /= axisLength;
    
    // Equation 1.6: cos φ = (s · e) / (|s| |e|)
    // Since we normalized s and e, |s| = |e| = 1
    double dotProduct = bspline_dot(s, e);
    
    // Clamp to [-1, 1] for numerical stability (floating-point errors)
    if (dotProduct > 1.0) dotProduct = 1.0;
    if (dotProduct < -1.0) dotProduct = -1.0;
    
    // Calculate angle in radians
    float angleRad = acosf(dotProduct);
    
    // Convert to degrees for glRotatef
    // WARNING: acos() returns radians, glRotatef() expects degrees!
    result.angle = angleRad * 180.0f / M_PI;
    
    return result;
}

/**
 * Apply axis-angle rotation in OpenGL
 * 
 * Convenience wrapper for glRotatef with AxisAngle structure.
 * 
 * @param aa Axis-angle rotation (angle in degrees, axis as normalized vector)
 */
void bspline_applyAxisAngle(AxisAngle aa) {
    glRotatef(aa.angle, aa.axis.x, aa.axis.y, aa.axis.z);
}

// ============================================================================
// DCM MATRIX ORIENTATION (Section 1.6 - Frenet-Serret Frame)
// ============================================================================

/**
 * Evaluate second derivative (acceleration) on segment at parameter t
 * 
 * Implements second derivative of equation 1.2:
 * p''(t) = [6t, 2, 0, 0] · B_{i,3} · R_i
 * 
 * The second derivative of power basis T = [t³, t², t, 1] is:
 * T'' = d²/dt²[t³, t², t, 1] = [6t, 2, 0, 0]
 * 
 * Used for computing normal vector in Frenet-Serret frame (equation 1.7).
 * 
 * @param controlPoints Array of control points
 * @param segment Segment index (1 to n-3)
 * @param t Parameter in [0, 1)
 * @return Second derivative vector (curvature direction, may be zero)
 */
Vec3 bspline_evaluateSecondDerivative(const Vec3* controlPoints, int segment, float t) {
    // Second derivative of power basis: d²/dt²[t³, t², t, 1] = [6t, 2, 0, 0]
    float Tdouble[4] = {6.0f * t, 2.0f, 0.0f, 0.0f};
    
    // Multiply by basis matrix B_{i,3} with factor 1/6
    float c[4];
    for (int j = 0; j < 4; j++) {
        c[j] = 0.0f;
        for (int i = 0; i < 4; i++) {
            c[j] += Tdouble[i] * B_SPLINE_BASIS[i][j];
        }
        c[j] /= 6.0f;
    }
    
    // Multiply by control point matrix R_i
    Vec3 secondDeriv = {0.0, 0.0, 0.0};
    for (int k = 0; k < 4; k++) {
        int idx = segment - 1 + k;
        secondDeriv.x += c[k] * controlPoints[idx].x;
        secondDeriv.y += c[k] * controlPoints[idx].y;
        secondDeriv.z += c[k] * controlPoints[idx].z;
    }
    
    return secondDeriv;
}

/**
 * Compute Frenet-Serret coordinate frame from curve
 * 
 * Implements equations 1.7 and 1.8 from section 1.6:
 * - Tangent (w): p'(t) - direction of motion (already have from section 1.2)
 * - Normal (u): p'(t) × p''(t) - equation 1.7 (toward center of curvature)
 * - Binormal (v): w × u - equation 1.8 (perpendicular to both)
 * 
 * These three vectors form a right-handed orthonormal coordinate system.
 * 
 * Special case: If p''(t) = 0 (colinear control points), we choose an
 * arbitrary perpendicular vector for the normal.
 * 
 * @param controlPoints Array of control points
 * @param segment Segment index (1 to n-3)
 * @param t Parameter in [0, 1)
 * @return Frenet-Serret frame with normalized tangent, normal, binormal
 */
FrenetFrame bspline_computeFrenetFrame(const Vec3* controlPoints, int segment, float t) {
    FrenetFrame frame;
    
    // 1. Tangent (w) - first derivative p'(t)
    Vec3 firstDeriv = bspline_evaluateTangent(controlPoints, segment, t);
    frame.tangent = bspline_normalize(firstDeriv);
    
    // 2. Second derivative p''(t)
    Vec3 secondDeriv = bspline_evaluateSecondDerivative(controlPoints, segment, t);
    
    // 3. Normal (u) - equation 1.7: u = p'(t) × p''(t)
    Vec3 normalRaw = bspline_cross(firstDeriv, secondDeriv);
    double normalLen = bspline_length(normalRaw);
    
    // Handle degenerate case: p''(t) = 0 or parallel to p'(t)
    // This happens when four control points are colinear (straight segment)
    if (normalLen < 1e-6) {
        // Choose arbitrary perpendicular vector to tangent
        // Pick axis that's least aligned with tangent
        if (fabs(frame.tangent.z) < 0.9) {
            // Use Z-axis to find perpendicular
            frame.normal = bspline_normalize(bspline_cross(frame.tangent, (Vec3){0.0, 0.0, 1.0}));
        } else {
            // Use X-axis to find perpendicular
            frame.normal = bspline_normalize(bspline_cross(frame.tangent, (Vec3){1.0, 0.0, 0.0}));
        }
    } else {
        frame.normal = bspline_normalize(normalRaw);
    }
    
    // 4. Binormal (v) - equation 1.8: v = w × u
    frame.binormal = bspline_cross(frame.tangent, frame.normal);
    frame.binormal = bspline_normalize(frame.binormal);  // Ensure unit length
    
    // Verify right-handed system: (w × u) · v should be positive
    // (Already satisfied by construction, but good to know)
    
    return frame;
}

/**
 * Convert Frenet-Serret frame to OpenGL 4x4 matrix
 * 
 * Implements equation 1.9: R = [w  u  v]
 * 
 * The DCM (Direction Cosine Matrix) is formed by placing the three
 * orthonormal vectors as columns of the matrix.
 * 
 * For OpenGL, we typically need R^(-1) = R^T (transpose) because:
 * - Object is defined in local space (x, y, z)
 * - We want to transform it to curve space (w, u, v)
 * - This is the inverse transformation
 * 
 * @param frame Frenet-Serret frame (w=tangent, u=normal, v=binormal)
 * @param matrix Output 4x4 matrix in OpenGL column-major format (16 floats)
 * @param useInverse If 1, compute R^T (for object→curve), if 0, compute R (for curve→object)
 */
void bspline_frenetToMatrix(FrenetFrame frame, float matrix[16], int useInverse) {
    // OpenGL uses column-major order: matrix[col*4 + row]
    
    if (useInverse) {
        // R^T (transpose) - for transforming object from local to curve space
        // Columns of R become rows of R^T, but in column-major format
        // this means we put vectors as ROWS instead of COLUMNS
        
        // Column 0 of R^T: first row of R = (wₓ, uₓ, vₓ)
        matrix[0] = frame.tangent.x;
        matrix[1] = frame.normal.x;
        matrix[2] = frame.binormal.x;
        matrix[3] = 0.0f;
        
        // Column 1 of R^T: second row of R = (wᵧ, uᵧ, vᵧ)
        matrix[4] = frame.tangent.y;
        matrix[5] = frame.normal.y;
        matrix[6] = frame.binormal.y;
        matrix[7] = 0.0f;
        
        // Column 2 of R^T: third row of R = (wᵤ, uᵤ, vᵤ)
        matrix[8] = frame.tangent.z;
        matrix[9] = frame.normal.z;
        matrix[10] = frame.binormal.z;
        matrix[11] = 0.0f;
        
        // Column 3: translation (none for rotation-only matrix)
        matrix[12] = 0.0f;
        matrix[13] = 0.0f;
        matrix[14] = 0.0f;
        matrix[15] = 1.0f;
    } else {
        // R (original) - columns are w, u, v (equation 1.9)
        
        // Column 0: tangent (w)
        matrix[0] = frame.tangent.x;
        matrix[1] = frame.tangent.y;
        matrix[2] = frame.tangent.z;
        matrix[3] = 0.0f;
        
        // Column 1: normal (u)
        matrix[4] = frame.normal.x;
        matrix[5] = frame.normal.y;
        matrix[6] = frame.normal.z;
        matrix[7] = 0.0f;
        
        // Column 2: binormal (v)
        matrix[8] = frame.binormal.x;
        matrix[9] = frame.binormal.y;
        matrix[10] = frame.binormal.z;
        matrix[11] = 0.0f;
        
        // Column 3: translation
        matrix[12] = 0.0f;
        matrix[13] = 0.0f;
        matrix[14] = 0.0f;
        matrix[15] = 1.0f;
    }
}

/**
 * Apply Frenet-Serret frame orientation in OpenGL
 * 
 * This function applies the DCM matrix (equation 1.9) to orient the object
 * along the curve using the tangent, normal, and binormal vectors.
 * 
 * The object's local X-axis will align with the tangent (forward),
 * Y-axis with the normal (up), and Z-axis with the binormal (right).
 * 
 * Call this after glTranslatef to apply orientation.
 * 
 * @param frame Frenet-Serret frame
 */
void bspline_applyFrenetFrame(FrenetFrame frame) {
    float matrix[16];
    bspline_frenetToMatrix(frame, matrix, 1);  // Use inverse (transpose)
    glMultMatrixf(matrix);
}

// ============================================================================
// EXAMPLE USAGE (commented out - for reference)
// ============================================================================

/*
int main() {
    // Example: Define control points for a B-spline curve
    Vec3 controlPoints[] = {
        {-2.0, -1.0, 0.0},  // r0
        {-1.5,  0.5, 0.0},  // r1
        {-0.5,  1.0, 0.0},  // r2
        { 0.5,  0.8, 0.0},  // r3
        { 1.5,  0.3, 0.0},  // r4
        { 2.0, -0.5, 0.0}   // r5
    };
    int n = 6;
    int numSegments = bspline_getNumSegments(n);
    
    printf("Control points: %d\n", n);
    printf("Segments: %d\n", numSegments);
    
    // Evaluate position and tangent on segment 1 at t = 0.5
    int segment = 1;
    float t = 0.5f;
    
    Vec3 pos = bspline_evaluatePosition(controlPoints, segment, t);
    Vec3 tan = bspline_evaluateTangent(controlPoints, segment, t);
    float angle = bspline_getOrientationAngle(tan);
    
    printf("\nSegment %d, t = %.2f:\n", segment, t);
    printf("Position: (%.3f, %.3f, %.3f)\n", pos.x, pos.y, pos.z);
    printf("Tangent:  (%.3f, %.3f, %.3f)\n", tan.x, tan.y, tan.z);
    printf("Angle:    %.2f degrees\n", angle);
    
    return 0;
}
*/
