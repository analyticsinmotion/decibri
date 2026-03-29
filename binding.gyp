{
  "targets": [
    {
      "target_name": "decibri",
      "sources": [
        "src/decibri.cc",

        "deps/portaudio/src/common/pa_allocation.c",
        "deps/portaudio/src/common/pa_converters.c",
        "deps/portaudio/src/common/pa_cpuload.c",
        "deps/portaudio/src/common/pa_dither.c",
        "deps/portaudio/src/common/pa_debugprint.c",
        "deps/portaudio/src/common/pa_front.c",
        "deps/portaudio/src/common/pa_process.c",
        "deps/portaudio/src/common/pa_ringbuffer.c",
        "deps/portaudio/src/common/pa_stream.c",
        "deps/portaudio/src/common/pa_trace.c"
      ],

      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "deps/portaudio/include",
        "deps/portaudio/src/common"
      ],

      "defines": [
        "NAPI_DISABLE_CPP_EXCEPTIONS",
        "NAPI_VERSION=6",
        "DECIBRI_VERSION=\"<!@(node -p \"require('./package.json').version\")\""
      ],

      "cflags!": ["-fno-exceptions"],
      "cflags_cc!": ["-fno-exceptions"],

      "conditions": [

        ["OS=='win'", {
          "sources": [
            "deps/portaudio/src/os/win/pa_win_util.c",
            "deps/portaudio/src/os/win/pa_win_version.c",
            "deps/portaudio/src/os/win/pa_win_waveformat.c",
            "deps/portaudio/src/os/win/pa_win_hostapis.c",
            "deps/portaudio/src/os/win/pa_win_coinitialize.c",
            "deps/portaudio/src/hostapi/wasapi/pa_win_wasapi.c"
          ],
          "include_dirs": [
            "deps/portaudio/src/os/win"
          ],
          "defines": [
            "PA_USE_WASAPI=1"
          ],
          "libraries": [
            "-lole32",
            "-lwinmm",
            "-lksuser",
            "-luuid",
            "-lavrt"
          ],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 1
            }
          }
        }],

        ["OS=='mac'", {
          "sources": [
            "deps/portaudio/src/os/unix/pa_unix_util.c",
            "deps/portaudio/src/os/unix/pa_unix_hostapis.c",
            "deps/portaudio/src/hostapi/coreaudio/pa_mac_core.c",
            "deps/portaudio/src/hostapi/coreaudio/pa_mac_core_utilities.c",
            "deps/portaudio/src/hostapi/coreaudio/pa_mac_core_blocking.c",
            "src/mac_permission.mm"
          ],
          "include_dirs": [
            "deps/portaudio/src/os/unix",
            "deps/portaudio/src/hostapi/coreaudio"
          ],
          "defines": [
            "PA_USE_COREAUDIO=1"
          ],
          "link_settings": {
            "libraries": [
              "-framework CoreAudio",
              "-framework AudioToolbox",
              "-framework AudioUnit",
              "-framework CoreServices",
              "-framework Carbon",
              "-framework AVFoundation"
            ]
          },
          "xcode_settings": {
            "GCC_ENABLE_CPP_EXCEPTIONS": "YES",
            "CLANG_CXX_LIBRARY": "libc++",
            "MACOSX_DEPLOYMENT_TARGET": "10.15",
            "OTHER_CFLAGS": ["-mmacosx-version-min=10.15"],
            "OTHER_CPLUSPLUSFLAGS": ["-mmacosx-version-min=10.15"]
          }
        }],

        ["OS=='linux'", {
          "sources": [
            "deps/portaudio/src/os/unix/pa_unix_util.c",
            "deps/portaudio/src/os/unix/pa_unix_hostapis.c",
            "deps/portaudio/src/hostapi/alsa/pa_linux_alsa.c"
          ],
          "include_dirs": [
            "deps/portaudio/src/os/unix"
          ],
          "defines": [
            "PA_USE_ALSA=1"
          ],
          "libraries": [
            "-lasound",
            "-lpthread"
          ]
        }]

      ]
    }
  ]
}
