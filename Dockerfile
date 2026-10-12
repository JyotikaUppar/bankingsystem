# ==========================================
# Stage 1: Build stage with Maven & Temurin JDK 21
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Copy application source code and build directly (avoids slow dependency:go-offline)
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
COPY src/ ./src/
RUN chmod +x ./mvnw && ./mvnw clean package -DskipTests -B

# ==========================================
# Stage 2: Hardened Runtime Image
# ==========================================
FROM eclipse-temurin:21-jre-alpine AS runner

# Create a secure non-root user and group
RUN addgroup -g 10001 -S appgroup && \
    adduser -u 10001 -S appuser -G appgroup

WORKDIR /app

# Install curl for health checking
RUN apk --no-cache add curl

# Copy only the compiled JAR from builder stage
COPY --from=builder --chown=appuser:appgroup /build/target/*.jar app.jar

# Switch to unprivileged user
USER 10001:10001

# Container-aware JVM options
ENV JAVA_OPTS="-XX:+UseContainerSupport -XX:MaxRAMPercentage=75.0 -Djava.security.egd=file:/dev/./urandom"
ENV SERVER_PORT=8080

EXPOSE 8080

# Health check using Spring Boot Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health/liveness || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
