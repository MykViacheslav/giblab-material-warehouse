using System;
using System.Diagnostics;
using System.IO;
using System.Net;
using System.Threading;
using System.Windows.Forms;

internal static class MagazynGibLabLauncher
{
    private const int Port = 3080;
    private const string Url = "http://127.0.0.1:3080/";
    private const string HealthUrl = "http://127.0.0.1:3080/api/health";

    [STAThread]
    private static void Main()
    {
        try
        {
            string appDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar);
            if (!File.Exists(Path.Combine(appDir, "server.js")))
            {
                appDir = @"C:\MagazynGibLab";
            }

            if (!IsServerHealthy())
            {
                StartServer(appDir);
                WaitForServer();
            }

            OpenBrowserApp();
            Environment.Exit(0);
        }
        catch (Exception error)
        {
            MessageBox.Show(
                "Nie udało się uruchomić Magazyn GibLab.\n\n" + error.Message,
                "Magazyn GibLab",
                MessageBoxButtons.OK,
                MessageBoxIcon.Error
            );
            Environment.Exit(1);
        }
    }

    private static bool IsServerHealthy()
    {
        try
        {
            var request = (HttpWebRequest)WebRequest.Create(HealthUrl);
            request.Timeout = 2000;
            request.ReadWriteTimeout = 2000;
            using (var response = (HttpWebResponse)request.GetResponse())
            {
                return response.StatusCode == HttpStatusCode.OK;
            }
        }
        catch
        {
            return false;
        }
    }

    private static void StartServer(string appDir)
    {
        string serverPath = Path.Combine(appDir, "server.js");
        if (!File.Exists(serverPath))
        {
            throw new FileNotFoundException("Nie znaleziono server.js", serverPath);
        }

        var startInfo = new ProcessStartInfo
        {
            FileName = "node.exe",
            Arguments = "server.js",
            WorkingDirectory = appDir,
            CreateNoWindow = true,
            UseShellExecute = false,
            WindowStyle = ProcessWindowStyle.Hidden
        };

        Process.Start(startInfo);
    }

    private static void WaitForServer()
    {
        for (int i = 0; i < 40; i++)
        {
            Thread.Sleep(500);
            if (IsServerHealthy()) return;
        }

        throw new TimeoutException("Serwer nie odpowiedział na porcie " + Port + ".");
    }

    private static void OpenBrowserApp()
    {
        string browser = FindBrowser();
        if (!string.IsNullOrEmpty(browser))
        {
            Process.Start(new ProcessStartInfo
            {
                FileName = browser,
                Arguments = "--app=" + Url,
                UseShellExecute = false
            });
            return;
        }

        Process.Start(new ProcessStartInfo
        {
            FileName = Url,
            UseShellExecute = true
        });
    }

    private static string FindBrowser()
    {
        string programFiles = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);
        string programFilesX86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
        string localAppData = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData);

        string[] paths =
        {
            Path.Combine(programFilesX86, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(programFiles, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(localAppData, @"Google\Chrome\Application\chrome.exe"),
            Path.Combine(programFilesX86, @"Microsoft\Edge\Application\msedge.exe"),
            Path.Combine(programFiles, @"Microsoft\Edge\Application\msedge.exe")
        };

        foreach (string path in paths)
        {
            if (File.Exists(path)) return path;
        }

        return "";
    }
}
