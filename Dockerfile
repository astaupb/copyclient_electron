FROM ubuntu:latest

RUN dpkg --add-architecture i386 && \
    apt update && \
    apt install -y apt-transport-https curl gnupg git rpm make jq sed binutils wine-stable wine32 nsis bsdtar && \
    curl -sL https://deb.nodesource.com/setup_13.x | bash - && \
    apt install -y nodejs && \
    sh -c 'curl https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add -' && \
    sh -c 'curl https://storage.googleapis.com/download.dartlang.org/linux/debian/dart_stable.list > /etc/apt/sources.list.d/dart_unstable.list' && \
    apt update && \
    apt install -y dart

ENV HOME="/root"
ENV PATH="/usr/lib/dart/bin:$HOME/.pub-cache/bin:${PATH}"
    
RUN pub global activate webdev

CMD ["bash"]
