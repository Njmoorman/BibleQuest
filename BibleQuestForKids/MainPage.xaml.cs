using Microsoft.Maui.ApplicationModel;
using Microsoft.Maui.Controls;
using Microsoft.Maui.Storage;
using System;
using System.IO;

#if IOS || MACCATALYST
using Foundation;
#endif

namespace BibleQuestForKids;

public partial class MainPage : ContentPage
{
    private bool _isInitialized;

    public MainPage()
    {
        InitializeComponent();
    }

    protected override void OnAppearing()
    {
        base.OnAppearing();

        if (_isInitialized)
        {
            return;
        }

        _isInitialized = true;

        var indexPath = EnsureWebAssets();
        var indexUri = new Uri(indexPath).AbsoluteUri;

        Browser.Source = new UrlWebViewSource { Url = indexUri };
    }

    private static string EnsureWebAssets()
    {
        // React/Vite assets are produced into wwwroot via `npm run build`.
        // Codemagic runs this step before each MAUI build (see codemagic.yaml),
        // but developers should re-run it locally whenever the web app changes.
        const string cacheFolderName = "webview";
        const string versionFileName = ".bundle-version";

        var targetRoot = Path.Combine(FileSystem.AppDataDirectory, cacheFolderName);
        var indexPath = Path.Combine(targetRoot, "index.html");
        var versionPath = Path.Combine(targetRoot, versionFileName);

        // Refresh cached assets whenever the packaged build number changes so
        // TestFlight/App Store updates always pick up the latest React bundle.
        var currentVersion = $"{AppInfo.Current.VersionString}+{AppInfo.Current.BuildString}";
        var needsRefresh = !File.Exists(indexPath);

        if (!needsRefresh && File.Exists(versionPath))
        {
            var cachedVersion = File.ReadAllText(versionPath).Trim();
            needsRefresh = !string.Equals(cachedVersion, currentVersion, StringComparison.Ordinal);
        }
        else if (!File.Exists(versionPath))
        {
            needsRefresh = true;
        }

        if (needsRefresh)
        {
            if (Directory.Exists(targetRoot))
            {
                Directory.Delete(targetRoot, recursive: true);
            }

            var packagedRoot = GetPackageAssetRoot();
            CopyDirectory(packagedRoot, targetRoot);
            Directory.CreateDirectory(targetRoot);
            File.WriteAllText(versionPath, currentVersion);
        }

        if (!File.Exists(indexPath))
        {
            throw new FileNotFoundException("Unable to locate the bundled web assets.", indexPath);
        }

        return indexPath;
    }

    private static string GetPackageAssetRoot()
    {
#if IOS || MACCATALYST
        // NSBundle ensures we resolve the on-device app bundle regardless of TestFlight/App Store packaging.
        return Path.Combine(NSBundle.MainBundle.BundlePath, "wwwroot");
#else
        // For Android (and other targets) rely on MAUI's abstraction when available.
        return Path.Combine(FileSystem.AppPackageDirectory, "wwwroot");
#endif
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
