package com.josenunezapps.distraguard.shortsprobe;

import android.accessibilityservice.AccessibilityService;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import java.util.ArrayDeque;

/**
 * Prueba técnica: solo YouTube y solo regla de Shorts habilitada.
 * No registra nombres de videos, canales ni textos. No tiene acceso a internet.
 */
public final class ShortsGuardianService extends AccessibilityService {
    private static final String YOUTUBE = "com.google.android.youtube";
    private static final long SCAN_GAP_MS = 450L;
    private static final long BLOCK_COOLDOWN_MS = 2400L;
    private static final int MAX_NODES = 320;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private long lastScanElapsed = 0L;
    private long lastBlockElapsed = 0L;
    private long lastObservationElapsed = 0L;
    private boolean backPending = false;

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        if (event == null || !Prefs.isEnabled(this)) return;
        if (event.getPackageName() == null ||
                !YOUTUBE.contentEquals(event.getPackageName())) return;

        long now = SystemClock.elapsedRealtime();
        if (now - lastObservationElapsed > 3000L) {
            lastObservationElapsed = now;
            Prefs.noteEvent(this);
        }
        if (backPending || now - lastBlockElapsed < BLOCK_COOLDOWN_MS) return;

        if (event.getEventType() == AccessibilityEvent.TYPE_VIEW_CLICKED
                && isShortsClick(event)) {
            block("Se tocó Shorts", 170L);
            return;
        }

        if (now - lastScanElapsed < SCAN_GAP_MS) return;
        lastScanElapsed = now;
        AccessibilityNodeInfo root = getRootInActiveWindow();
        if (root == null) return;

        ShortsDetector.Signals signals = scan(root);
        if (ShortsDetector.isShortsPlayer(signals)) {
            block("Reproductor Shorts detectado", 0L);
        }
    }

    private boolean isShortsClick(AccessibilityEvent event) {
        CharSequence label = event.getContentDescription();
        if (ShortsDetector.isShortsClick(null, label == null ? null : label.toString())) {
            return true;
        }
        for (CharSequence c : event.getText()) {
            if (ShortsDetector.isShortsClick(c == null ? null : c.toString(), null)) {
                return true;
            }
        }
        AccessibilityNodeInfo src = event.getSource();
        if (src == null) return false;
        CharSequence text = src.getText();
        CharSequence description = src.getContentDescription();
        return ShortsDetector.isShortsClick(
                text == null ? null : text.toString(),
                description == null ? null : description.toString());
    }

    private ShortsDetector.Signals scan(AccessibilityNodeInfo root) {
        ShortsDetector.Signals result = new ShortsDetector.Signals();
        ArrayDeque<AccessibilityNodeInfo> queue = new ArrayDeque<>();
        queue.add(root);
        int visited = 0;

        while (!queue.isEmpty() && visited < MAX_NODES) {
            AccessibilityNodeInfo node = queue.removeFirst();
            visited++;
            CharSequence text = node.getText();
            CharSequence description = node.getContentDescription();
            result.add(node.getViewIdResourceName(),
                    text == null ? null : text.toString(),
                    description == null ? null : description.toString());
            for (int i = 0; i < node.getChildCount(); i++) {
                AccessibilityNodeInfo child = node.getChild(i);
                if (child != null) queue.addLast(child);
            }
        }
        return result;
    }

    private void block(String reason, long delayMs) {
        backPending = true;
        lastBlockElapsed = SystemClock.elapsedRealtime();
        handler.postDelayed(() -> {
            backPending = false;
            if (!Prefs.isEnabled(this)) return;
            boolean succeeded = performGlobalAction(GLOBAL_ACTION_BACK);
            if (succeeded) Prefs.noteBlock(this, reason);
        }, delayMs);
    }

    @Override
    public void onInterrupt() {
        // No se realiza ninguna acción.
    }

    @Override
    public void onDestroy() {
        handler.removeCallbacksAndMessages(null);
        super.onDestroy();
    }
}
