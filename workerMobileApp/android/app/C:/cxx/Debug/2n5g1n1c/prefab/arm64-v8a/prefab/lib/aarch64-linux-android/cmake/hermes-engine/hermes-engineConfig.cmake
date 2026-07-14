if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "/home/neosoftmailcom/.gradle/caches/8.13/transforms/afcd3640ee2faa12bc2b461830adb1e2/transformed/hermes-android-250829098.0.10-debug/prefab/modules/hermesvm/libs/android.arm64-v8a/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "/home/neosoftmailcom/.gradle/caches/8.13/transforms/afcd3640ee2faa12bc2b461830adb1e2/transformed/hermes-android-250829098.0.10-debug/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

