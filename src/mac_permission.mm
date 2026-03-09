#import <AVFoundation/AVFoundation.h>

// CheckMicrophonePermission — macOS only (compiled via binding.gyp OS=='mac').
//
// Returns nullptr if the process may proceed (Authorized or NotDetermined).
// Returns a static error string if permission is Denied or Restricted.
//
// NotDetermined: PortAudio will trigger the OS permission dialog on first
// access naturally. After the user denies, status becomes Denied and the
// next call returns the error string.
extern "C" const char* CheckMicrophonePermission() {
  AVAuthorizationStatus status =
      [AVCaptureDevice authorizationStatusForMediaType:AVMediaTypeAudio];

  if (status == AVAuthorizationStatusDenied ||
      status == AVAuthorizationStatusRestricted) {
    return "Microphone access denied. "
           "Enable access in System Settings \xe2\x86\x92 Privacy & Security \xe2\x86\x92 Microphone.";
  }
  return nullptr;  // Authorized or NotDetermined — proceed
}
