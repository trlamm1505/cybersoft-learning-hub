n = int(input())
nums = list(map(int, input().split()))
nums.sort(key=abs)
print(' '.join(map(str, nums)))