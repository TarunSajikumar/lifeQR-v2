Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$voices = $synth.GetInstalledVoices()
Write-Host "Installed Voices count: $($voices.Count)"
foreach ($v in $voices) {
    Write-Host "Voice: $($v.VoiceInfo.Name) | Culture: $($v.VoiceInfo.Culture)"
}
$synth.Dispose()
