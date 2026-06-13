#include <signal.h>
#include <unistd.h>
#include <sys/types.h>

int main(void)
{
    setuid(0);
    setgid(0);
    kill(1, SIGUSR1);
    return 0;
}