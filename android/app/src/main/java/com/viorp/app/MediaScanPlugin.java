package com.viorp.app;

import android.Manifest;
import android.media.MediaScannerConnection;
import android.os.Build;
import android.os.Environment;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.util.ArrayList;
import java.util.List;

/**
 * Re-indexes the public Downloads/Documents/DCIM/Pictures folders in MediaStore
 * so files saved moments ago (browser downloads, other apps) appear in the
 * picker straight away, the way WhatsApp's picker shows them.
 */
@CapacitorPlugin(
    name = "MediaScan",
    permissions = {
        @Permission(alias = "media", strings = { Manifest.permission.READ_MEDIA_IMAGES, Manifest.permission.READ_MEDIA_VIDEO }),
        @Permission(alias = "storage", strings = { Manifest.permission.READ_EXTERNAL_STORAGE })
    }
)
public class MediaScanPlugin extends Plugin {
    private static final int MAX_FILES = 400;

    private String alias() {
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU ? "media" : "storage";
    }

    @PluginMethod
    public void scan(PluginCall call) {
        if (getPermissionState(alias()) != PermissionState.GRANTED) {
            requestPermissionForAlias(alias(), call, "permissionCallback");
            return;
        }
        runScan(call);
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        runScan(call);
    }

    private void runScan(PluginCall call) {
        List<String> paths = new ArrayList<>();
        String[] dirs = { Environment.DIRECTORY_DOWNLOADS, Environment.DIRECTORY_DOCUMENTS, Environment.DIRECTORY_PICTURES, Environment.DIRECTORY_DCIM, Environment.DIRECTORY_MOVIES };
        for (String d : dirs) collect(Environment.getExternalStoragePublicDirectory(d), paths, 0);
        if (!paths.isEmpty()) {
            MediaScannerConnection.scanFile(getContext(), paths.toArray(new String[0]), null, null);
        }
        JSObject ret = new JSObject();
        ret.put("scanned", paths.size());
        ret.put("granted", getPermissionState(alias()) == PermissionState.GRANTED);
        call.resolve(ret);
    }

    private void collect(File dir, List<String> out, int depth) {
        if (dir == null || !dir.isDirectory() || depth > 2 || out.size() >= MAX_FILES) return;
        File[] files = dir.listFiles();
        if (files == null) return;
        for (File f : files) {
            if (out.size() >= MAX_FILES) return;
            if (f.isDirectory()) collect(f, out, depth + 1);
            else if (System.currentTimeMillis() - f.lastModified() < 7L * 24 * 3600 * 1000) out.add(f.getAbsolutePath());
        }
    }
}
