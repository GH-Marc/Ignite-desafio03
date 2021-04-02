import { GetStaticPaths, GetStaticProps } from 'next';
import { useRouter } from 'next/router';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';

import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';

import Link from 'next/link';
import Head from 'next/head';
import Header from '../../components/Header';
import Utterances from '../../components/Utterances';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';

interface Post {
  uid?: string;
  nextPost: {
    title?: string;
    slug?: string;
  };
  prevPost: {
    title?: string;
    slug?: string;
  };
  first_publication_date: string | null;
  last_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
  preview: boolean;
}

export default function Post({ post, preview }: PostProps): JSX.Element {
  const router = useRouter();

  const estimatedReadTime = Math.ceil(
    post.data.content
      .map(content => {
        const headingWords = +content.heading.split(' ').length;
        const bodyWords = +RichText.asText(content.body).split(' ').length;
        const total = headingWords + bodyWords;

        return total;
      })
      .reduce((acc, value) => {
        return acc + value;
      }) / 200
  );

  if (router.isFallback) {
    return <div>Carregando...</div>;
  }

  return (
    <>
      <Head>
        <title>spacetraveling | {post.data.title}</title>
      </Head>

      <div className={styles.container}>
        <Header />

        <img src={post.data.banner.url} alt="banner" />

        <div className={styles.content}>
          <strong className={styles.title}>{post.data.title}</strong>
          <span className={styles.info}>
            <section>
              <FiCalendar />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </section>
            <section>
              <FiUser />
              {post.data.author}
            </section>
            <section>
              <FiClock />
              {estimatedReadTime} min
            </section>
          </span>
          <p className={styles.publicationDate}>
            {post.last_publication_date &&
              format(
                new Date(post.last_publication_date),
                "'* editado em 'dd MMM yyyy', às ' HH:ss",
                {
                  locale: ptBR,
                }
              )}
          </p>
          {post.data.content.map(content => (
            <div key={content.heading} className={styles.textContent}>
              <h1>{content.heading}</h1>
              <section>
                {content.body.map((body, i) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <p key={i}>{body.text}</p>
                ))}
              </section>
            </div>
          ))}

          <div className={styles.postsNavigation}>
            <span>
              {post.prevPost.slug && (
                <>
                  <p>{post.prevPost.title}</p>
                  <Link href={`/post/${post.prevPost.slug}`}>
                    <a>Post anterior</a>
                  </Link>
                </>
              )}
            </span>
            <span>
              {post.nextPost.slug && (
                <>
                  <p>{post.nextPost.title}</p>
                  <Link href={`/post/${post.nextPost.slug}`}>
                    <a>Próximo Post</a>
                  </Link>
                </>
              )}
            </span>
          </div>
          <Utterances />
          {preview && (
            <aside>
              <Link href="/api/exit-preview">
                <a>Sair do modo Preview</a>
              </Link>
            </aside>
          )}
        </div>
      </div>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query('');

  const results = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths: results,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async ({
  params,
  previewData,
  preview = false,
}) => {
  const prismic = getPrismicClient();
  const { slug } = params;

  const response = await prismic.getByUID('posts', String(slug), {
    ref: previewData?.ref ?? null,
  });

  if (!response) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  const prevPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title'],
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title'],
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date desc]',
    }
  );

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    last_publication_date: response.last_publication_date,
    prevPost: {
      title:
        prevPost.results.length > 0 ? prevPost.results[0].data.title : null,
      slug: prevPost.results.length > 0 ? prevPost.results[0].uid : null,
    },
    nextPost: {
      title:
        nextPost.results.length > 0 ? nextPost.results[0].data.title : null,
      slug: nextPost.results.length > 0 ? nextPost.results[0].uid : null,
    },
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [
            ...content.body.map(body => {
              return {
                spans: body.spans,
                text: body.text,
                type: body.type,
              };
            }),
          ],
        };
      }),
    },
  };

  return {
    props: {
      post,
      preview,
    },
  };
};
