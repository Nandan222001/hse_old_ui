if(NOT TARGET ReactAndroid::hermestooling)
add_library(ReactAndroid::hermestooling SHARED IMPORTED)
set_target_properties(ReactAndroid::hermestooling PROPERTIES
    IMPORTED_LOCATION "/home/neosoftmailcom/.gradle/caches/8.13/transforms/6f116ddd9b2d1bfa83363b27cbde843a/transformed/react-android-0.85.3-debug/prefab/modules/hermestooling/libs/android.x86/libhermestooling.so"
    INTERFACE_INCLUDE_DIRECTORIES "/home/neosoftmailcom/.gradle/caches/8.13/transforms/6f116ddd9b2d1bfa83363b27cbde843a/transformed/react-android-0.85.3-debug/prefab/modules/hermestooling/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

if(NOT TARGET ReactAndroid::jsi)
add_library(ReactAndroid::jsi SHARED IMPORTED)
set_target_properties(ReactAndroid::jsi PROPERTIES
    IMPORTED_LOCATION "/home/neosoftmailcom/.gradle/caches/8.13/transforms/6f116ddd9b2d1bfa83363b27cbde843a/transformed/react-android-0.85.3-debug/prefab/modules/jsi/libs/android.x86/libjsi.so"
    INTERFACE_INCLUDE_DIRECTORIES "/home/neosoftmailcom/.gradle/caches/8.13/transforms/6f116ddd9b2d1bfa83363b27cbde843a/transformed/react-android-0.85.3-debug/prefab/modules/jsi/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

if(NOT TARGET ReactAndroid::reactnative)
add_library(ReactAndroid::reactnative SHARED IMPORTED)
set_target_properties(ReactAndroid::reactnative PROPERTIES
    IMPORTED_LOCATION "/home/neosoftmailcom/.gradle/caches/8.13/transforms/6f116ddd9b2d1bfa83363b27cbde843a/transformed/react-android-0.85.3-debug/prefab/modules/reactnative/libs/android.x86/libreactnative.so"
    INTERFACE_INCLUDE_DIRECTORIES "/home/neosoftmailcom/.gradle/caches/8.13/transforms/6f116ddd9b2d1bfa83363b27cbde843a/transformed/react-android-0.85.3-debug/prefab/modules/reactnative/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

