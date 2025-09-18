using Microsoft.Maui.Controls;
using System;
using System.IO;

namespace BibleQuestForKids;

public partial class MainPage : ContentPage
{
    public MainPage()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private void OnLoaded(object? sender, EventArgs e)
    {
        Loaded -= OnLoaded;

        var indexPath = EnsureWebAssets();
        var indexUri = new Uri(indexPath).AbsoluteUri;

        Browser.Source = new UrlWebViewSource { Url = indexUri };
    }

    private static string EnsureWebAssets()
    {
        // React/Vite assets are produced into wwwroot/dist via `npm run build`.
        // Codemagic runs this step before each MAUI build (see codemagic.yaml),
        // but developers should re-run it locally whenever the web app changes.
        const string buildFolderName = "dist";
        const string cacheFolderName = "webview";

        var targetRoot = Path.Combine(FileSystem.AppDataDirectory, cacheFolderName);
        var targetDist = Path.Combine(targetRoot, buildFolderName);
        var indexPath = Path.Combine(targetDist, "index.html");

        if (!File.Exists(indexPath))
        {
            var packageDist = Path.Combine(FileSystem.AppPackageDirectory, "wwwroot", buildFolderName);
            CopyDirectory(packageDist, targetDist);
        }

        if (!File.Exists(indexPath))
        {
            throw new FileNotFoundException("Unable to locate the bundled web assets.", indexPath);
        }

        return indexPath;
    }

    private static void CopyDirectory(string sourceDir, string destinationDir)
    {
        if (!Directory.Exists(sourceDir))
        {
            throw new DirectoryNotFoundException($"Source asset folder not found: {sourceDir}");
        }

        Directory.CreateDirectory(destinationDir);

        foreach (var directoryPath in Directory.GetDirectories(sourceDir, "*", SearchOption.AllDirectories))
        {
            var relativeDir = Path.GetRelativePath(sourceDir, directoryPath);
            var targetDir = Path.Combine(destinationDir, relativeDir);
            Directory.CreateDirectory(targetDir);
        }

        foreach (var filePath in Directory.GetFiles(sourceDir, "*", SearchOption.AllDirectories))
        {
            var relativeFile = Path.GetRelativePath(sourceDir, filePath);
            var targetFile = Path.Combine(destinationDir, relativeFile);

            var targetDirectory = Path.GetDirectoryName(targetFile);
            if (!string.IsNullOrEmpty(targetDirectory))
            {
                Directory.CreateDirectory(targetDirectory);
            }

            File.Copy(filePath, targetFile, overwrite: true);
        }
    }
}
