package com.viorp.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Handles Decline on the ringing notification: stops the ringing and closes the call screen. */
public class CallActionReceiver extends BroadcastReceiver {

    static final String ACTION_DECLINE = "com.viorp.app.CALL_DECLINE";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (ACTION_DECLINE.equals(intent.getAction())) {
            CallNotifier.cancel(context, intent.getStringExtra(CallNotifier.EXTRA_CALL_ID));
        }
    }
}
