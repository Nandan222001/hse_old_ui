@echo off
setlocal
set "PROJECT_DIR=%~dp0"
set "JAVA_HOME=C:\Program Files\Android\Android Studio1\jbr"
set "PATH=%JAVA_HOME%\bin;%PATH%"
set "ADB=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe"
set "EMULATOR=%LOCALAPPDATA%\Android\Sdk\emulator\emulator.exe"
set "SDK_DIR=%LOCALAPPDATA%\Android\Sdk"

:: Make sure Android SDK is known to gradle
if not exist "%PROJECT_DIR%android\local.properties" (
    echo sdk.dir=%SDK_DIR:\=/% > "%PROJECT_DIR%android\local.properties"
    echo ndk.dir=%SDK_DIR:\=/%/ndk/27.1.12297006 >> "%PROJECT_DIR%android\local.properties"
    echo Created android\local.properties
)

:: Start emulator if no device connected
"%ADB%" devices | findstr "device" | findstr /v "List" >nul 2>&1
if %errorlevel% neq 0 (
    echo No device found. Starting Pixel_4 emulator...
    start "" "%EMULATOR%" -avd Pixel_4 -no-snapshot-load -memory 1536 -cores 2 -gpu swiftshader_indirect -no-boot-anim -accel on
    echo Waiting for emulator to boot...
    :waitloop
    timeout /t 5 /nobreak >nul
    "%ADB%" -e shell getprop sys.boot_completed 2>nul | findstr "1" >nul
    if %errorlevel% neq 0 goto waitloop
    echo Emulator ready.
) else (
    echo Physical device or emulator already connected.
)

:: Start Metro bundler in a new window if not already running
netstat -ano | findstr ":8081" >nul 2>&1
if %errorlevel% neq 0 (
    echo Starting Metro bundler...
    start "Metro Bundler" cmd /k "cd /d "%PROJECT_DIR%" && npx react-native start --reset-cache"
    echo Waiting for Metro to be ready...
    timeout /t 10 /nobreak >nul
) else (
    echo Metro already running on port 8081.
)

:: Build and install using real path (NO subst Z: drive)
cd /d "%PROJECT_DIR%android"
call gradlew.bat app:installDebug -PreactNativeDevServerPort=8081
if %errorlevel% neq 0 exit /b %errorlevel%

:: Forward Metro port and launch app
"%ADB%" reverse tcp:8081 tcp:8081
"%ADB%" shell monkey -p com.workerapp -c android.intent.category.LAUNCHER 1
endlocal
