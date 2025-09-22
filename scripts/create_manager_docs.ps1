$ErrorActionPreference = 'Stop';
$dir = 'August Tectangle Sprint/tectangle-gesture-keyboard-mobile/docs/manager-discovery';
if (-not (Test-Path -LiteralPath $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
$managers = @(
'AbsoluteScaleManager.js',
'CameraManager.js',
'EventBusManager.js',
'GestureLooperManager.js',
'HandModelManager.js',
'KeyboardManager.js',
'KinematicClampManager.js',
'LandmarkRawManager.js',
'LandmarkSmoothManager.js',
'ManagerRegistry.js',
'OnboardingManager.js',
'PinchRecognitionManager.js',
'PredictiveLatencyManager.js',
'QuantizationManager.js',
'RecordingManager.js',
'TelemetryManager.js',
'UIManager.js',
'VisualManager.js',
'WatchdogManager.js'
)
$bt = [char]96;
foreach ($m in $managers) {
  $base = $m -replace '\.js$','';
  $mdPath = Join-Path $dir ($base + '.md');
  if (Test-Path -LiteralPath $mdPath) {
    Write-Output ("EXISTS|{0}" -f $mdPath);
    continue;
  }
  $lines = @(
    '---',
    'source: [' + $bt + $base + '.js' + $bt + '](August Tectangle Sprint/tectangle-gesture-keyboard-mobile/src/' + $base + '.js:1)',
    'status: stub_created',
    '---',
    '',
    '# ' + $base,
    '',
    'Source: [' + $bt + $base + '.js' + $bt + '](August Tectangle Sprint/tectangle-gesture-keyboard-mobile/src/' + $base + '.js:1)',
    '',
    'TODO: paste header excerpt and discovery metadata here. This file is a minimal stub created so the user can fill it incrementally.'
  )
  $lines | Out-File -FilePath $mdPath -Encoding utf8;
  Write-Output ("CREATED|{0}" -f $mdPath);
}