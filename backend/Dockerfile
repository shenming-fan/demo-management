# ========== Stage 1: Build ==========
FROM maven:3.8-openjdk-8 AS build
WORKDIR /build
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# ========== Stage 2: Run ==========
FROM openjdk:8-jre-slim
WORKDIR /app
RUN mkdir -p /app/uploads
COPY --from=build /build/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar", "--spring.profiles.active=docker"]
