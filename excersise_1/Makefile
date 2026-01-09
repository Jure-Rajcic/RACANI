# Makefile for Exercise 1: B-Spline Path Following
# macOS with system GLUT

CC = clang
CFLAGS = -Wall -O2 -I.
LDFLAGS = -framework OpenGL -framework GLUT -lm

# Source files
SOURCES = main.c \
          bspline.c \
          obj_loader.c \
          file_io.c \
          visualization.c

# Object files
OBJECTS = $(SOURCES:.c=.o)

# Executable
TARGET = exercise1

# Default target
all: $(TARGET)

# Link
$(TARGET): $(OBJECTS)
	@echo "Linking $(TARGET)..."
	$(CC) $(OBJECTS) $(LDFLAGS) -o $(TARGET)
	@echo "Build complete! Run with: ./$(TARGET)"

# Compile
%.o: %.c
	@echo "Compiling $<..."
	$(CC) $(CFLAGS) -c $< -o $@

# Clean
clean:
	@echo "Cleaning..."
	rm -f $(OBJECTS) $(TARGET)
	@echo "Clean complete!"

# Rebuild
rebuild: clean all

# Run
run: $(TARGET)
	./$(TARGET)

# Debug build
debug: CFLAGS += -g -DDEBUG
debug: rebuild

# Print info
info:
	@echo "=== Build Info ==="
	@echo "Compiler: $(CC)"
	@echo "Flags: $(CFLAGS)"
	@echo "Linker flags: $(LDFLAGS)"
	@echo "Sources: $(SOURCES)"
	@echo "Target: $(TARGET)"
	@echo "=================="

.PHONY: all clean rebuild run debug info
