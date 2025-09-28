using System.Threading.Tasks;
using Microsoft.Maui;
using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Graphics;

namespace BibleQuestForKids;

public partial class App : Application
{
    public App()
    {
        InitializeComponent();

        // Show a branded splash handoff before the WebView is ready. Keeps TestFlight/App Store builds consistent.
        MainPage = new ContentPage
        {
            BackgroundColor = Colors.White,
            Content = new Grid
            {
                Children =
                {
                    new Image
                    {
                        Source = "Resources/Images/splash.png",
                        Aspect = Aspect.AspectFit,
                        HorizontalOptions = LayoutOptions.Center,
                        VerticalOptions = LayoutOptions.Center
                    }
                }
            }
        };

        // Warm up the WebView after the splash appears, then swap the actual page in place.
        MainThread.BeginInvokeOnMainThread(async () =>
        {
            await Task.Delay(500);
            MainPage = new MainPage();
        });
    }
}
