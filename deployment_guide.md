# Deployment Guide: Spring Boot + MySQL Link Shortener

This guide walks you through deploying your Link Shortener application to cloud hosting platforms like **Railway** (highly recommended) or **Render**.

---

## Recommended Path: Deployment via Railway (Easiest)

Railway is the easiest cloud platform for this setup because it allows you to provision a MySQL database and a Java web service in the same project with automatic linking.

### Step 1: Push your Code to GitHub
1. Create a new repository on [GitHub](https://github.com/) (e.g., `link-shortener`).
2. Run these commands in your project directory (`e:\Link Shortner Project`) to push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### Step 2: Spin Up MySQL on Railway
1. Go to [Railway.app](https://railway.app/) and sign in with your GitHub account.
2. Click **New Project** -> Select **Provision MySQL**.
3. Railway will provision a fully configured MySQL database instance in a few seconds.

### Step 3: Deploy the Spring Boot Web Service
1. In the same Railway project, click **New** (or "+ Add") -> Select **GitHub Repo**.
2. Select your `link-shortener` repository.
3. Railway will immediately detect it is a Maven project and start building it.

### Step 4: Link Database Environment Variables
For the backend to communicate with the database, we need to map Railway's database credentials to our Spring Boot configuration.
1. Click on your **Web Service** card (the Spring Boot application).
2. Go to the **Variables** tab.
3. Click **Add Variable** (or **New Variable**) and add the following:
   * **`SPRING_DATASOURCE_URL`**: `jdbc:mysql://${{MYSQLHOST}}:${{MYSQLPORT}}/${{MYSQLDATABASE}}?useSSL=false&allowPublicKeyRetrieval=true`
   * **`SPRING_DATASOURCE_USERNAME`**: `${{MYSQLUSER}}`
   * **`SPRING_DATASOURCE_PASSWORD`**: `${{MYSQLPASSWORD}}`
4. Click **Save**. Railway will automatically trigger a redeploy with these environment variables injected.

### Step 5: Expose a Public URL
1. Go to your **Web Service** card -> **Settings** tab.
2. Under the **Networking** section, click **Generate Domain**.
3. Railway will generate a public URL (e.g., `https://link-shortener-production.up.railway.app`).
4. **Done!** Open this link in any browser, and you can access your dashboard from any device.

---

## Alternative Path: Deployment via Render

Render provides free hosting for web services but does not offer a free native MySQL service (only PostgreSQL). You can host a free MySQL database on another service like [Aiven](https://aiven.io/) or [Tidb Cloud](https://pingcap.com/products/tidb-cloud), then connect it to Render.

### Step 1: Create a MySQL Database on Aiven (or similar)
1. Sign up for a free account on [Aiven.io](https://aiven.io/).
2. Create a new **Free MySQL** service.
3. Note down the **Service URI**, **User**, and **Password** once the database is running.

### Step 2: Push your Code to GitHub
*(Follow the same GitHub push instructions as Step 1 in the Railway guide).*

### Step 3: Deploy Web Service on Render
1. Go to [Render.com](https://render.com/) and sign in.
2. Click **New +** -> Select **Web Service**.
3. Link your GitHub account and select your `link-shortener` repository.
4. Set the following settings:
   * **Runtime**: `Java` (Select Java version 17 or higher)
   * **Build Command**: `./mvnw clean install -DskipTests` (or `mvn clean install -DskipTests` if Maven is preinstalled)
   * **Start Command**: `java -jar target/link-shortener-0.0.1-SNAPSHOT.jar`
   * **Instance Type**: `Free`

### Step 4: Add Environment Variables on Render
1. Scroll down to the **Environment Variables** section.
2. Add the following variables:
   * **`SPRING_DATASOURCE_URL`**: `jdbc:mysql://<AIVEN_HOST>:<AIVEN_PORT>/defaultdb?useSSL=true` *(Replace with your Aiven connection details)*
   * **`SPRING_DATASOURCE_USERNAME`**: `<AIVEN_USER>`
   * **`SPRING_DATASOURCE_PASSWORD`**: `<AIVEN_PASSWORD>`
3. Click **Create Web Service**.
4. Render will compile and start your Spring Boot application and provide you with a public HTTPS link.
