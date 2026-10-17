package com.josenunezapps.distraguard.shortsprobe;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/** Reglas conservadoras, sin permisos Android: se pueden probar con javac. */
public final class ShortsDetector {
    private ShortsDetector() {}

    public static final class Signals {
        public final List<String> ids = new ArrayList<>();
        public final List<String> labels = new ArrayList<>();
        public boolean hasShortsLabel;
        public boolean hasReelPlayerId;

        public void add(String viewId, String text, String description) {
            if (viewId != null && !viewId.isEmpty()) {
                String id = norm(viewId);
                ids.add(id);
                // IDs de reproductor, no el botón Shorts de la barra inferior.
                if (id.contains("reel_player") || id.contains("reel_watch")
                        || id.contains("shorts_player") || id.contains("shorts_watch")) {
                    hasReelPlayerId = true;
                }
            }
            addLabel(text);
            addLabel(description);
        }

        private void addLabel(String candidate) {
            if (candidate == null || candidate.isEmpty()) return;
            String label = norm(candidate);
            if (label.isEmpty()) return;
            if (label.equals("shorts") || label.startsWith("shorts -")
                    || label.startsWith("shorts,")) hasShortsLabel = true;
            labels.add(label);
        }
    }

    public static boolean isShortsClick(String text, String description) {
        return isShortsTabLabel(text) || isShortsTabLabel(description);
    }

    private static boolean isShortsTabLabel(String label) {
        String s = norm(label);
        return s.equals("shorts")
                || s.equals("shorts, tab")
                || s.equals("shorts tab")
                || s.equals("pestana shorts")
                || s.equals("shorts, pestana");
    }

    public static boolean isShortsPlayer(Signals signals) {
        if (signals.hasReelPlayerId) return true;

        // El texto «Shorts» solo puede ser la pestaña de inicio: no basta.
        if (!signals.hasShortsLabel) return false;

        boolean remix = containsAny(signals.labels,
                "remix", "remixar", "usar este sonido", "use this sound",
                "original audio", "audio original", "pagina del sonido",
                "sound page");
        boolean actions = containsAny(signals.labels,
                "comentarios", "comments", "compartir", "share",
                "me gusta", "like", "suscribirse", "subscribe");

        return remix && actions;
    }

    private static boolean containsAny(List<String> all, String... needles) {
        for (String entry : all) {
            for (String needle : needles) {
                if (entry.contains(needle)) return true;
            }
        }
        return false;
    }

    private static String norm(String input) {
        if (input == null) return "";
        String noMarks = Normalizer.normalize(input, Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        return noMarks.trim().toLowerCase(Locale.ROOT);
    }
}
