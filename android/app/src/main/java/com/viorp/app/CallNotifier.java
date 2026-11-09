package com.viorp.app;

import android.Manifest;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import androidx.core.content.ContextCompat;
import java.util.Map;

/** Builds the ringing incoming-call notification with a full-screen lock-screen UI. */
final class CallNotifier {

    static final String CHANNEL_ID = "viorp_calls_ring";
    static final long RING_TIMEOUT_MS = 45_000L;
    static final String EXTRA_CALL_ID = "callId";
    static final String EXTRA_CHAT_ID = "chatId";
    static final String EXTRA_CALLER = "callerName";
    static final String EXTRA_VIDEO = "video";

    private CallNotifier() {}

    static int notificationId(String callId) {
        return ("call:" + callId).hashCode();
    }

    static void ensureChannel(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = context.getSystemService(NotificationManager.class);
        if (manager == null || manager.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel channel = new NotificationChannel(CHANNEL_ID, "Incoming calls", NotificationManager.IMPORTANCE_HIGH);
        channel.setDescription("Rings for incoming voice and video calls");
        AudioAttributes attributes = new AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
            .build();
        channel.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE), attributes);
        channel.enableVibration(true);
        channel.setVibrationPattern(new long[] { 0, 1000, 1000 });
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        channel.setBypassDnd(false);
        manager.createNotificationChannel(channel);
    }

    static Intent answerIntent(Context context, String chatId, String callId) {
        Uri uri = Uri.parse("https://viorp.com/chat?room=" + Uri.encode(chatId) + "&answer=" + Uri.encode(callId));
        Intent intent = new Intent(Intent.ACTION_VIEW, uri, context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return intent;
    }

    static void show(Context context, Map<String, String> data) {
        String callId = data.get("callId");
        String chatId = data.get("chatId");
        if (callId == null || chatId == null) return;
        if (Build.VERSION.SDK_INT >= 33
            && ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            return;
        }
        String caller = data.get("callerName") != null ? data.get("callerName") : "Viorp";
        boolean video = "VIDEO".equals(data.get("mode"));
        ensureChannel(context);

        int id = notificationId(callId);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;

        Intent screen = new Intent(context, IncomingCallActivity.class)
            .putExtra(EXTRA_CALL_ID, callId)
            .putExtra(EXTRA_CHAT_ID, chatId)
            .putExtra(EXTRA_CALLER, caller)
            .putExtra(EXTRA_VIDEO, video)
            .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_USER_ACTION);
        PendingIntent screenIntent = PendingIntent.getActivity(context, id, screen, flags);
        PendingIntent answer = PendingIntent.getActivity(context, id + 1, answerIntent(context, chatId, callId), flags);
        Intent decline = new Intent(context, CallActionReceiver.class)
            .setAction(CallActionReceiver.ACTION_DECLINE)
            .putExtra(EXTRA_CALL_ID, callId);
        PendingIntent declineIntent = PendingIntent.getBroadcast(context, id + 2, decline, flags);

        NotificationCompat.Builder builder = new NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.sym_call_incoming)
            .setContentTitle(caller)
            .setContentText(video ? "Incoming video call" : "Incoming voice call")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_CALL)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(true)
            .setTimeoutAfter(RING_TIMEOUT_MS)
            .setContentIntent(screenIntent)
            .setFullScreenIntent(screenIntent, true)
            .addAction(0, "Decline", declineIntent)
            .addAction(0, "Answer", answer);
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            builder.setSound(RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE), AudioManager.STREAM_RING);
            builder.setVibrate(new long[] { 0, 1000, 1000 });
        }
        Notification notification = builder.build();
        // Keep ringing until answered, declined or timed out.
        notification.flags |= Notification.FLAG_INSISTENT;

        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.notify(id, notification);
    }

    static void cancel(Context context, String callId) {
        if (callId == null) return;
        NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager != null) manager.cancel(notificationId(callId));
        IncomingCallActivity.close(callId);
    }
}
