package com.viorp.app;

import android.app.ActivityManager;
import androidx.annotation.NonNull;
import com.capacitorjs.plugins.pushnotifications.MessagingService;
import com.google.firebase.messaging.RemoteMessage;
import java.util.Map;

/**
 * Extends Capacitor's FCM service: call pushes ring full screen (even on the lock
 * screen) when the app is not open; everything else goes to the JS plugin as before.
 */
public class CallMessagingService extends MessagingService {

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        Map<String, String> data = remoteMessage.getData();
        String type = data.get("type");
        if ("call".equals(type)) {
            // With the app on screen the socket already rings inside the app.
            if (!isAppInForeground()) CallNotifier.show(this, data);
            return;
        }
        if ("call_cancel".equals(type)) {
            CallNotifier.cancel(this, data.get("callId"));
            return;
        }
        super.onMessageReceived(remoteMessage);
    }

    private boolean isAppInForeground() {
        ActivityManager.RunningAppProcessInfo info = new ActivityManager.RunningAppProcessInfo();
        ActivityManager.getMyMemoryState(info);
        return info.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND;
    }
}
