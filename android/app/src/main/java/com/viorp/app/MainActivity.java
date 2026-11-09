package com.viorp.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MediaScanPlugin.class);
        registerPlugin(DevicePermissionsPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
