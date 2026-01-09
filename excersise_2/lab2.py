"""
Particle System Demo
====================
Interactive particle system demonstrating different particle types
with gravity physics and death effects.

Controls:
- Mouse movement: Generates particles at mouse position
- Key 1: White particles that fade as they die
- Key 2: Particles that change color and size as they die
- Key +: Increase particle size
- Key -: Decrease particle size
"""

import pyglet
import pyglet.shapes
import random
import math

# =============================================================================
# WINDOW CONFIGURATION
# =============================================================================
# Window dimensions - supports Retina/HiDPI displays
width = 1280
height = 720
window = pyglet.window.Window(width, height, resizable=True)

# =============================================================================
# GLOBAL VARIABLES
# =============================================================================
# Mouse position tracking - particles are generated at this position
mouse_x = width // 2
mouse_y = height // 2

# Gravity constant - negative value pulls particles downward
GRAVITY = +150

# Particle size - can be changed with +/- keys
particle_size = 3

# Particle type: 'circle' (white) or 'color' (changes color and size)
particle_type = 'circle'

# Batch for efficient rendering - all particles are drawn at once
batch = pyglet.graphics.Batch()


# =============================================================================
# PARTICLE CLASS - Represents a single particle in the system
# =============================================================================
class Particle:
    """
    Class representing a single particle.
    
    Attributes:
        x, y: Particle position
        vx, vy: Particle velocity
        life: Remaining lifetime of the particle
        max_life: Initial lifetime (for ratio calculation)
        ptype: Particle type ('circle' or 'color')
        shape: Pyglet Circle object for rendering
        initial_size: Initial size (for shrinking effect)
    """
    
    def __init__(self, x, y, vx, vy, life, batch, ptype):
        """
        Initializes a new particle.
        
        Args:
            x, y: Initial position
            vx, vy: Initial velocity
            life: Lifetime in seconds
            batch: Pyglet batch for rendering
            ptype: Particle type ('circle' or 'color')
        """
        self.x = x
        self.y = y
        self.vx = vx
        self.vy = vy
        self.life = life
        self.max_life = life
        self.ptype = ptype
        
        # Create circle for particle rendering
        self.shape = pyglet.shapes.Circle(x, y, particle_size, color=(255, 255, 255), batch=batch)
        self.initial_size = particle_size
    
    def update(self, dt, window_height):
        """
        Updates particle state for one time step.
        
        Args:
            dt: Delta time - time since last update
            window_height: Window height for fade effect calculation
            
        Returns:
            bool: True if particle is still alive, False if it should be removed
        """
        # Apply gravity to vertical velocity
        self.vy += GRAVITY * dt
        
        # Update position based on velocity
        self.x += self.vx * dt
        self.y += self.vy * dt
        
        # Reduce remaining lifetime
        self.life -= dt
        
        # Calculate factors for fade effect
        # height_ratio: 1 at top of screen, 0 at bottom
        height_ratio = max(0, self.y / window_height)
        # life_ratio: 1 at start of life, 0 at end
        life_ratio = max(0, self.life / self.max_life)
        # fade: combination of both factors - particle fades both as it falls and as it dies
        fade = min(height_ratio, life_ratio)
        
        if self.ptype == 'circle':
            # White particle - only fades to black
            self.shape.x = self.x
            self.shape.y = self.y
            self.shape.color = (
                int(255 * fade),
                int(255 * fade),
                int(255 * fade)
            )
        elif self.ptype == 'color':
            # Color-changing particle - update position
            self.shape.x = self.x
            self.shape.y = self.y
            
            # Shrink size as particle dies
            self.shape.radius = self.initial_size * life_ratio
            
            # Color transition: red -> orange -> yellow -> green -> blue
            # t goes from 0 (start) to 1 (death)
            t = 1 - life_ratio
            
            if t < 0.25:
                # Red to orange (increase green)
                r, g, b = 255, int(255 * (t / 0.25)), 0
            elif t < 0.5:
                # Orange to yellow (stays yellow)
                r, g, b = 255, 255, 0
            elif t < 0.75:
                # Yellow to green (decrease red)
                r, g, b = int(255 * (1 - (t - 0.5) / 0.25)), 255, 0
            else:
                # Green to blue (decrease green, increase blue)
                r, g, b = 0, int(255 * (1 - (t - 0.75) / 0.25)), int(255 * ((t - 0.75) / 0.25))
            
            self.shape.color = (r, g, b)
        
        # Check if particle is still alive
        alive = self.life > 0 and self.y > 0
        
        # If particle dies, delete its shape from batch
        if not alive:
            self.shape.delete()
        
        return alive


# =============================================================================
# GLOBAL PARTICLE SYSTEM STATE
# =============================================================================
# List of all active particles
particles = []

# Timer for particle spawning
particle_spawn_timer = 0

# Interval between particle spawns (in seconds)
spawn_rate = 0.02


# =============================================================================
# EVENT HANDLERS - Functions that respond to user actions
# =============================================================================
@window.event
def on_mouse_motion(x, y, dx, dy):
    """
    Tracks mouse position when mouse moves.
    Particles will be generated at this position.
    """
    global mouse_x, mouse_y
    mouse_x = x
    mouse_y = y


@window.event
def on_key_press(symbol, modifiers):
    """
    Handles key presses to change settings.
    
    Keys:
        +/=: Increase particle size (max 20)
        -: Decrease particle size (min 1)
        1: Switch to white fading particles
        2: Switch to color-changing particles
    """
    global particle_size, particle_type
    
    if symbol == symbol == pyglet.window.key.EQUAL:
        # Increase size, maximum 20
        particle_size = min(particle_size + 1, 20)
    elif symbol == pyglet.window.key.MINUS:
        # Decrease size, minimum 1
        particle_size = max(particle_size - 1, 1)
    elif symbol == pyglet.window.key._1:
        # White particles that fade
        particle_type = 'circle'
    elif symbol == pyglet.window.key._2:
        # Particles that change color and size
        particle_type = 'color'


@window.event
def on_draw():
    """
    Draws all elements on screen.
    Called automatically every frame.
    """
    # Clear the screen
    window.clear() # TODO: In showcase show this cool thingy
    # Draw all particles from batch
    batch.draw()


# =============================================================================
# MAIN UPDATE FUNCTION
# =============================================================================
def update(dt):
    """
    Main function for updating game state.
    Called 60 times per second.
    
    Args:
        dt: Delta time - time since last call
    """
    global particles, particle_spawn_timer
    
    # Update all particles and keep only those that are still alive
    particles = [p for p in particles if p.update(dt, window.height)]
    
    # Generate new particles at mouse position
    particle_spawn_timer -= dt
    if particle_spawn_timer <= 0:
        # Generate a burst of 5 particles
        for _ in range(5):
            # Random angle for direction (0 to 2*pi radians)
            angle = random.uniform(0, 2 * math.pi)
            # Random speed
            speed = random.uniform(30, 80)
            # Calculate velocity components from angle and speed
            vx = speed * math.cos(angle)
            vy = speed * math.sin(angle) + 50  # +50 for initial upward "jump"
            # Random lifetime
            life = random.uniform(2, 4)
            # Create new particle
            particles.append(Particle(mouse_x, mouse_y, vx, vy, life, batch, particle_type))
        
        # Reset timer
        particle_spawn_timer = spawn_rate


# =============================================================================
# APPLICATION STARTUP
# =============================================================================
# Schedule update function to be called 60 times per second
pyglet.clock.schedule_interval(update, 1/60.0) #TODO: Showcase this cool thingy

# Start the main application loop
pyglet.app.run()


# =============================================================================
# HOW TO RUN THIS APPLICATION
# =============================================================================
# 1. Open terminal and navigate to the project directory:
#    cd /Users/jurerajcic/Desktop/RACANI/excersise_2/RACANI/lab2
#
# 2. Activate the virtual environment:
#    source venv/bin/activate
#
# 3. Run the application:
#    python lab2.py
#
# 4. To deactivate the virtual environment when done:
#    deactivate
# =============================================================================