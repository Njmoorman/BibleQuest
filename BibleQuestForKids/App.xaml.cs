using Microsoft.Maui.Controls;

namespace BibleQuestForKids
{
    public partial class App : Application
    {
        public App()
        {
            InitializeComponent();

            // ✅ Set the main page to a BlazorWebView host
            MainPage = new ContentPage
            {
                Content = new BlazorWebView
                {
                    HostPage = "wwwroot/index.html",   // ✅ your bundled Blazor app
                    RootComponents =
                    {
                        new RootComponent
                        {
                            Selector = "#app",
                            ComponentType = typeof(Main)
                        }
                    }
                }
            };
        }
    }
}