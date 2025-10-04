import javax.swing.*;
import javax.swing.border.*;
import javax.swing.table.*;
import java.awt.*;
import java.awt.event.*;
import java.io.*;
import java.net.*;
import java.util.*;
import java.util.List;
import java.util.Timer;
import org.json.*;

public class ImprovedAdminPanel extends JFrame {
    private static final String SERVER_URL = "http://192.168.89.31:3000";
    
    // Enhanced Modern Colors
    private static final Color PRIMARY = new Color(79, 70, 229);
    private static final Color PRIMARY_LIGHT = new Color(129, 140, 248);
    private static final Color SUCCESS = new Color(34, 197, 94);
    private static final Color ERROR = new Color(239, 68, 68);
    private static final Color WARNING = new Color(251, 146, 60);
    private static final Color INFO = new Color(59, 130, 246);
    private static final Color BG = new Color(248, 250, 252);
    private static final Color CARD = Color.WHITE;
    private static final Color TEXT = new Color(15, 23, 42);
    private static final Color TEXT_LIGHT = new Color(100, 116, 139);
    private static final Color BORDER = new Color(226, 232, 240);
    private static final Color HOVER = new Color(241, 245, 249);
    
    private JPanel mainPanel, contentPanel, dashboardPanel;
    private CardLayout contentLayout;
    private JLabel statusLabel, connectedCountLabel, serverStatusLabel;
    private JTextArea logArea;
    private Timer refreshTimer;
    private boolean isConnected = false;
    private Map<String, JButton> menuButtons = new HashMap<>();
    private String currentView = "DASHBOARD";
    
    public ImprovedAdminPanel() {
        initializeUI();
        showWelcomeDialog();
        testConnection();
        startAutoRefresh();
    }
    
    public static void main(String[] args) {
        try {
            UIManager.setLookAndFeel(UIManager.getSystemLookAndFeelClassName());
            UIManager.put("Button.arc", 10);
            UIManager.put("Component.arc", 10);
            UIManager.put("TextComponent.arc", 10);
        } catch (Exception e) {}
        
        SwingUtilities.invokeLater(() -> {
            ImprovedAdminPanel panel = new ImprovedAdminPanel();
            panel.setVisible(true);
        });
    }
