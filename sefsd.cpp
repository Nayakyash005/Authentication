#include <vector>
#include <string>
#include <iostream>
#include <climits>
using namespace std;

void fun(string s, vector<string> &ans, int j) {
    int n = ans.size();
    if (j == s.size()) {
        return;
    }
    int initialSize = ans.size();
    for (int i = 0; i < initialSize; i++) {
        ans.push_back(ans[i] + s[j]);
    }
    fun(s, ans, j + 1);
}

string moreSubsequence(int n, int m, string a, string b) {
    vector<string> ans1{""}; // Initialize with an empty string
    vector<string> ans2{""}; // Initialize with an empty string
    fun(a, ans1, 0);
    fun(b, ans2, 0);
    string fans;
    string sans;
    int max1 = INT_MIN;
    int max2 = INT_MIN;
    for (int i = 0; i < ans1.size(); i++) {
        int cnt = 0;
        for (int j = 0; j < ans1[i].size() - 1; j++) {
            if (ans1[i][j] == ans1[i][j + 1]) {
                cnt = 0;
            } else {
                cnt++;
            }
            
        }
        if (cnt > max1) {
                fans = ans1[i];
                max1 = cnt;
            }
    }

    for (int i = 0; i < ans2.size(); i++) {
        int cnt = 0;
        for (int j = 0; j < ans2[i].size() - 1; j++) {
            if (ans2[i][j] == ans2[i][j + 1]) {
                cnt = 0;
            } else {
                cnt++;
            }
           
        }
         if (cnt > max2) {
                sans = ans2[i];
                max2 = cnt;
            }
    }
    if (max1 < max2) {
        return sans;
    } else {
        return fans;
    }
}

int main() {
    // Test the function
    string result = moreSubsequence(0, 0, "abc", "def");
    cout << "Result: " << result << endl;
    return 0;
}
