package com.viorp.app;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.lang.ref.WeakReference;

/** Full-screen ringing screen that shows over the lock screen for an incoming call. */
public class IncomingCallActivity extends Activity {

    private static WeakReference<IncomingCallActivity> current = new WeakReference<>(null);

    private final Handler handler = new Handler(Looper.getMainLooper());
    private String callId;
    private String chatId;

    static void close(String callId) {
        IncomingCallActivity activity = current.get();
        if (activity != null && callId != null && callId.equals(activity.callId)) activity.finish();
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        Intent intent = getIntent();
        callId = intent.getStringExtra(CallNotifier.EXTRA_CALL_ID);
        chatId = intent.getStringExtra(CallNotifier.EXTRA_CHAT_ID);
        String caller = intent.getStringExtra(CallNotifier.EXTRA_CALLER);
        boolean video = intent.getBooleanExtra(CallNotifier.EXTRA_VIDEO, false);
        if (callId == null || chatId == null) {
            finish();
            return;
        }
        current = new WeakReference<>(this);
        setContentView(buildView(caller != null ? caller : "Viorp", video));
        handler.postDelayed(this::finish, CallNotifier.RING_TIMEOUT_MS);
    }

    private LinearLayout buildView(String caller, boolean video) {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER_HORIZONTAL);
        root.setBackgroundColor(Color.parseColor("#0B1220"));
        root.setPadding(dp(24), dp(96), dp(24), dp(64));

        TextView label = text(video ? "Incoming video call" : "Incoming voice call", 16, Color.parseColor("#94A3B8"), false);
        TextView name = text(caller, 30, Color.WHITE, true);
        name.setPadding(0, dp(12), 0, 0);
        TextView brand = text("Viorp", 14, Color.parseColor("#64748B"), false);
        brand.setPadding(0, dp(8), 0, 0);
        root.addView(label);
        root.addView(name);
        root.addView(brand);

        LinearLayout spacer = new LinearLayout(this);
        root.addView(spacer, new LinearLayout.LayoutParams(1, 0, 1f));

        LinearLayout actions = new LinearLayout(this);
        actions.setOrientation(LinearLayout.HORIZONTAL);
        actions.setGravity(Gravity.CENTER);
        Button decline = roundButton("Decline", "#EF4444");
        Button answer = roundButton("Answer", "#22C55E");
        decline.setOnClickListener(v -> {
            CallNotifier.cancel(this, callId);
            finish();
        });
        answer.setOnClickListener(v -> answer());
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(dp(120), dp(56));
        params.setMargins(dp(16), 0, dp(16), 0);
        actions.addView(decline, params);
        actions.addView(answer, new LinearLayout.LayoutParams(params));
        root.addView(actions);
        return root;
    }

    private void answer() {
        String id = callId;
        String chat = chatId;
        CallNotifier.cancel(this, id);
        KeyguardManager keyguard = (KeyguardManager) getSystemService(KEYGUARD_SERVICE);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O && keyguard != null && keyguard.isKeyguardLocked()) {
            keyguard.requestDismissKeyguard(this, new KeyguardManager.KeyguardDismissCallback() {
                @Override
                public void onDismissSucceeded() {
                    openApp(chat, id);
                }

                @Override
                public void onDismissError() {
                    openApp(chat, id);
                }
            });
            return;
        }
        openApp(chat, id);
    }

    private void openApp(String chat, String id) {
        startActivity(CallNotifier.answerIntent(this, chat, id));
        finish();
    }

    private TextView text(String value, int sp, int color, boolean bold) {
        TextView view = new TextView(this);
        view.setText(value);
        view.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        view.setTextColor(color);
        view.setGravity(Gravity.CENTER);
        view.setMaxLines(2);
        if (bold) view.setTypeface(Typeface.DEFAULT_BOLD);
        return view;
    }

    private Button roundButton(String label, String color) {
        Button button = new Button(this);
        button.setText(label);
        button.setTextColor(Color.WHITE);
        button.setAllCaps(false);
        button.setTextSize(TypedValue.COMPLEX_UNIT_SP, 16);
        GradientDrawable shape = new GradientDrawable();
        shape.setColor(Color.parseColor(color));
        shape.setCornerRadius(dp(28));
        button.setBackground(shape);
        return button;
    }

    private int dp(int value) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, value, getResources().getDisplayMetrics()));
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        if (current.get() == this) current = new WeakReference<>(null);
        super.onDestroy();
    }
}
