using Microsoft.Maui.Controls;
using Microsoft.Maui.Graphics;

namespace BibleQuestForKids;

public partial class MainPage : ContentPage
{
    public MainPage()
    {
        InitializeComponent();
        // Transparent background avoids a white flash during WebView initialization.
        AppWebView.BackgroundColor = Colors.Transparent;

        // Load the bundled Vite build directly from the application package.
        AppWebView.Source = "appbundle:/wwwroot/dist/index.html";
    }
}
