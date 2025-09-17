using Microsoft.Maui.Controls;
using System;

namespace BibleQuestForKids;

public partial class MainPage : ContentPage
{
    public MainPage()
    {
        InitializeComponent();

        var htmlPath = Path.Combine(FileSystem.AppDataDirectory, "index.html");

        // Copy index.html from embedded asset to local app storage
        if (!File.Exists(htmlPath))
        {
            using var stream = FileSystem.OpenAppPackageFileAsync("wwwroot/index.html").Result;
            using var reader = new StreamReader(stream);
            var htmlContent = reader.ReadToEnd();
            File.WriteAllText(htmlPath, htmlContent);
        }

        Browser.Source = new UrlWebViewSource { Url = $"file://{htmlPath}" };
    }
}
