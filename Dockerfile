FROM ubuntu:latest

# set timezone info so apt can run without prompts
ENV TZ="Europe/Berlin"
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN dpkg --add-architecture i386 && apt update
RUN apt install -y apt-transport-https curl gnupg git
RUN apt install -y rpm make jq sed binutils libarchive-tools libc6:i386
RUN apt install -y wine-stable
RUN apt install -y wine32
RUN apt install -y nsis
RUN curl -sL https://deb.nodesource.com/setup_13.x | bash -
RUN apt install -y nodejs
RUN sh -c 'curl https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -'
RUN sh -c 'curl https://storage.googleapis.com/download.dartlang.org/linux/debian/dart_stable.list > /etc/apt/sources.list.d/dart_stable.list'
RUN apt update && apt install -y dart

ENV HOME="/root"
ENV PATH="/usr/lib/dart/bin:$HOME/.pub-cache/bin:${PATH}"
    
RUN pub global activate webdev

CMD ["bash"]
