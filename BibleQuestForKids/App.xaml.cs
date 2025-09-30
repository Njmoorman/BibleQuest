using Microsoft.Maui.Controls;
using Microsoft.AspNetCore.Components.WebView.Maui;
using BibleQuestForKids.Pages;  // ✅ add this so Main.razor is recognized

namespace BibleQuestForKids
{
    public partial class App : Application
    {
        public App()
        {
            InitializeComponent();

            MainPage = new ContentPage
            {
                Content = new BlazorWebView
                {
                    HostPage = "wwwroot/index.html",
                    RootComponents =
                    {
                        new RootComponent
                        {
                            Selector = "#app",
                            ComponentType = typeof(Main)  // ✅ now maps to Main.razor
                        }
                    }
                }
            };
        }
    }
}